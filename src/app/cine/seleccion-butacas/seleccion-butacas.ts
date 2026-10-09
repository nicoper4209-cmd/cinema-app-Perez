import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CineStore } from '../cine-store.service';
import { Butaca, Funcion } from '../cine.model';
import { VentasService, EntradaConfirmada } from '../../services/ventas.service';

interface EntradaConQr extends EntradaConfirmada {
  qrDataUrl: string;
}

@Component({
  selector: 'app-seleccion-butacas',
  imports: [RouterLink, DatePipe],
  templateUrl: './seleccion-butacas.html',
  styleUrl: './seleccion-butacas.css',
})
export class SeleccionButacas {
  private readonly store = inject(CineStore);
  private readonly ventas = inject(VentasService);

  peliculaId = input<number>(0, { transform: (value: unknown) => Number(value ?? 0) });
  funcionId = input<number>(0, { transform: (value: unknown) => Number(value ?? 0) });

  readonly pelicula = computed(() =>
    this.store.peliculas().find((item) => item.id === this.peliculaId())
  );

  readonly funcion = computed<Funcion | undefined>(() =>
    this.store.funciones().find((item) => item.id === this.funcionId())
  );

  readonly butacas = this.store.butacas;
  readonly disponibilidad = this.store.disponibilidad;
  readonly cargando = this.store.cargando;
  readonly error = this.store.error;
  readonly butacasSeleccionadas = computed(() =>
    this.butacas().filter((butaca) => this.seleccionada().has(butaca.id))
  );
  readonly seleccionContigua = computed(() => {
    const asientos = this.butacasSeleccionadas().sort((a, b) => a.numero - b.numero);
    if (asientos.length < 2) return true;
    if (asientos.some((butaca) => butaca.fila !== asientos[0].fila)) return false;
    return asientos.every((butaca, indice) => indice === 0 || butaca.numero === asientos[indice - 1].numero + 1);
  });
  readonly seleccionada = signal<Set<number>>(new Set());

  readonly pagoConfirmado = signal(false);
  readonly procesandoCompra = signal(false);
  readonly codigoCompra = signal('');
  readonly totalConfirmado = signal<number | null>(null);
  readonly descuentoConfirmado = signal(0);
  readonly puntosUsadosConfirmados = signal(0);
  readonly puntosObtenidosConfirmados = signal(0);
  readonly entradasConfirmadas = signal<EntradaConQr[]>([]);
  readonly qrListo = computed(() =>
    this.entradasConfirmadas().length > 0 && this.entradasConfirmadas().every((entrada) => Boolean(entrada.qrDataUrl))
  );
  readonly mensajePago = signal('');
  readonly compradorNombre = signal('');
  readonly compradorEmail = signal('');
  readonly diaNacimiento = signal('');
  readonly mesNacimiento = signal('');
  readonly anioNacimiento = signal('');
  readonly diasNacimiento = Array.from({ length: 31 }, (_, indice) => String(indice + 1).padStart(2, '0'));
  readonly mesesNacimiento = [
    { valor: '01', nombre: 'Enero' },
    { valor: '02', nombre: 'Febrero' },
    { valor: '03', nombre: 'Marzo' },
    { valor: '04', nombre: 'Abril' },
    { valor: '05', nombre: 'Mayo' },
    { valor: '06', nombre: 'Junio' },
    { valor: '07', nombre: 'Julio' },
    { valor: '08', nombre: 'Agosto' },
    { valor: '09', nombre: 'Septiembre' },
    { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' },
    { valor: '12', nombre: 'Diciembre' },
  ];
  readonly aniosNacimiento = Array.from(
    { length: 121 },
    (_, indice) => String(new Date().getFullYear() - indice)
  );
  readonly codigoCupon = signal('');
  readonly puntosDisponibles = signal(0);
  readonly puntosAUsar = signal(0);

  constructor() {
    void this.ventas.obtenerSaldoPuntos()
      .then((saldo) => this.puntosDisponibles.set(saldo))
      .catch(() => this.puntosDisponibles.set(0));

    effect(() => {
      const id = this.funcionId();
      const funcion = this.funcion();
      if (!id) return;

      if (!funcion) {
        void this.store.cargarFuncionPorId(id);
        return;
      }

      this.seleccionada.set(new Set());
      void this.store.cargarButacasPorSala(funcion.salaId);
      void this.store.cargarDisponibilidadFuncion(id);
    });
  }

  toggleButaca(butaca: Butaca): void {
    if (!this.butacaDisponible(butaca.id)) return;

    this.seleccionada.update((actual) => {
      const nueva = new Set(actual);
      if (nueva.has(butaca.id)) nueva.delete(butaca.id);
      else nueva.add(butaca.id);
      return nueva;
    });
  }

  isSeleccionada(butacaId: number): boolean {
    return this.seleccionada().has(butacaId);
  }

  butacaDisponible(butacaId: number): boolean {
    const estado = this.disponibilidad().find((item) => item.butacaId === butacaId)?.estado;
    return !estado || estado === 'disponible';
  }

  claseButaca(butacaId: number): string {
    return this.disponibilidad().find((item) => item.butacaId === butacaId)?.estado ?? 'disponible';
  }

  costoTotal(): number {
    const seleccionadas = this.seleccionada();
    if (!seleccionadas.size) return 0;

    return this.butacas()
      .filter((butaca) => seleccionadas.has(butaca.id))
      .reduce((total, butaca) => {
        const precioDisponibilidad = this.disponibilidad().find((item) => item.butacaId === butaca.id)?.precioFinal;
        const precioPorTipo = butaca.tipo === 'vip'
          ? this.funcion()?.precioVip
          : butaca.tipo === 'accesible'
            ? this.funcion()?.precioAccesible
            : this.funcion()?.precioBase;
        return total + (precioDisponibilidad || precioPorTipo || butaca.precio);
      }, 0);
  }

  async simularPago(): Promise<void> {
    if (!this.seleccionada().size) {
      this.mensajePago.set('Selecciona al menos una butaca antes de continuar.');
      return;
    }

    if (!this.seleccionContigua()) {
      this.mensajePago.set('Selecciona butacas contiguas de una misma fila.');
      return;
    }

    const funcion = this.funcion();
    if (!funcion) {
      this.mensajePago.set('No se pudo encontrar la función seleccionada.');
      return;
    }

    const fechaNacimientoIso = this.convertirFechaNacimiento(this.fechaNacimientoIngresada());
    if (!this.compradorNombre().trim() || !this.esEmailValido(this.compradorEmail()) || !fechaNacimientoIso) {
      this.mensajePago.set('Completa nombre, correo y fecha de nacimiento para continuar.');
      return;
    }

    if (!this.edadPermiteCompra(fechaNacimientoIso, this.pelicula()?.clasificacion ?? 'ATP')) {
      this.mensajePago.set('La edad declarada no permite comprar entradas para esta película.');
      return;
    }

    const puntosSolicitados = this.puntosAUsar();
    if (
      !Number.isInteger(puntosSolicitados) ||
      puntosSolicitados < 0 ||
      puntosSolicitados > this.puntosDisponibles()
    ) {
      this.mensajePago.set('La cantidad de puntos debe ser entera y no superar tu saldo.');
      return;
    }

    this.procesandoCompra.set(true);
    this.mensajePago.set('Registrando la compra simulada...');

    try {
      const compra = await this.ventas.confirmarCompraEntradas({
        funcionId: funcion.id,
        butacasIds: [...this.seleccionada()],
        compradorNombre: this.compradorNombre().trim(),
        compradorEmail: this.compradorEmail().trim(),
        fechaNacimiento: fechaNacimientoIso,
        codigoCupon: this.codigoCupon().trim(),
        puntosUsar: this.puntosAUsar(),
      });

      this.codigoCompra.set(String(compra.pedidoId));
      this.totalConfirmado.set(compra.total);
      this.descuentoConfirmado.set(compra.descuentoAplicado);
      this.puntosUsadosConfirmados.set(compra.puntosUsados);
      this.puntosObtenidosConfirmados.set(compra.puntosObtenidos);
      this.puntosDisponibles.update((saldo) => saldo - compra.puntosUsados + compra.puntosObtenidos);
      this.entradasConfirmadas.set(compra.entradas.map((entrada) => ({ ...entrada, qrDataUrl: '' })));
      this.pagoConfirmado.set(true);
      this.mensajePago.set('Pago simulado y compra registrados correctamente.');

      try {
        const qrCode = await import('qrcode');
        const entradasConQr = await Promise.all(
          compra.entradas.map(async (entrada) => ({
            ...entrada,
            qrDataUrl: await qrCode.toDataURL(entrada.codigoQr, { width: 180, margin: 1 }),
          }))
        );
        this.entradasConfirmadas.set(entradasConQr);
      } catch {
        this.mensajePago.set('La compra quedó registrada, pero no se pudieron generar las imágenes QR.');
      }

      await this.store.cargarDisponibilidadFuncion(funcion.id);
    } catch (error) {
      this.mensajePago.set(this.mensajeError(error));
    } finally {
      this.procesandoCompra.set(false);
    }
  }

  etiquetaButaca(butacaId: number): string {
    const butaca = this.butacas().find((item) => item.id === butacaId);
    return butaca ? `${butaca.fila}${butaca.numero}` : String(butacaId);
  }

  async descargarComprobante(): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const documento = new jsPDF();
      const pelicula = this.pelicula();
      const funcion = this.funcion();

      this.entradasConfirmadas().forEach((entrada, indice) => {
        if (indice > 0) documento.addPage();

        documento.setFontSize(20);
        documento.text('Entrada de cine', 20, 24);
        documento.setFontSize(12);
        documento.text(`Pedido #${this.codigoCompra()}`, 20, 36);
        documento.text(`Película: ${pelicula?.titulo ?? ''}`, 20, 46);
        documento.text(`Función: ${funcion ? new Date(funcion.fechaHoraInicio).toLocaleString('es-AR') : ''}`, 20, 56);
        documento.text(`Butaca: ${this.etiquetaButaca(entrada.butacaId)}`, 20, 66);
        documento.text(`Importe: $${entrada.precio}`, 20, 76);
        documento.text(`Código: ${entrada.codigoQr}`, 20, 86);
        documento.addImage(entrada.qrDataUrl, 'PNG', 20, 96, 52, 52);
      });

      documento.save(`entradas-pedido-${this.codigoCompra()}.pdf`);
    } catch {
      this.mensajePago.set('La compra está confirmada, pero no se pudo generar el PDF.');
    }
  }

  private esEmailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private fechaNacimientoIngresada(): string {
    const dia = this.diaNacimiento().trim();
    const mes = this.mesNacimiento().trim();
    const anio = this.anioNacimiento().trim();
    if (!dia || !mes || !anio) return '';
    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`;
  }

  private convertirFechaNacimiento(fecha: string): string | null {
    const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha.trim());
    if (!coincidencia) return null;

    const [, diaTexto, mesTexto, anioTexto] = coincidencia;
    const dia = Number(diaTexto);
    const mes = Number(mesTexto);
    const anio = Number(anioTexto);
    const fechaComprobacion = new Date(Date.UTC(anio, mes - 1, dia));

    if (
      fechaComprobacion.getUTCFullYear() !== anio ||
      fechaComprobacion.getUTCMonth() !== mes - 1 ||
      fechaComprobacion.getUTCDate() !== dia
    ) {
      return null;
    }

    return `${anioTexto}-${mesTexto}-${diaTexto}`;
  }

  private edadPermiteCompra(fechaNacimiento: string, clasificacion: string): boolean {
    const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime()) || nacimiento > new Date()) return false;

    let edad = new Date().getFullYear() - nacimiento.getFullYear();
    const mes = new Date().getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && new Date().getDate() < nacimiento.getDate())) edad--;

    if (clasificacion === '+18') return edad >= 18;
    if (clasificacion === '+13') return edad >= 13;
    return true;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return 'No se pudo registrar la compra. Intenta nuevamente.';
  }
}
