import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CineStore } from '../cine-store.service';
import { Butaca, Funcion } from '../cine.model';

@Component({
  selector: 'app-seleccion-butacas',
  imports: [RouterLink, DatePipe],
  templateUrl: './seleccion-butacas.html',
  styleUrl: './seleccion-butacas.css',
})
export class SeleccionButacas {
  private readonly store = inject(CineStore);

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
  readonly seleccionada = signal<Set<number>>(new Set());

  readonly pagoConfirmado = signal(false);
  readonly codigoCompra = signal('');
  readonly mensajePago = signal('');

  constructor() {
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

  simularPago(): void {
    if (!this.seleccionada().size) {
      this.pagoConfirmado.set(false);
      this.codigoCompra.set('');
      this.mensajePago.set('Selecciona al menos una butaca antes de continuar.');
      return;
    }

    if (!this.funcion()) {
      this.pagoConfirmado.set(false);
      this.codigoCompra.set('');
      this.mensajePago.set('No se pudo encontrar la función seleccionada.');
      return;
    }

    const total = this.costoTotal();
    const codigo = `CINE-${Date.now().toString().slice(-8)}`;

    this.codigoCompra.set(codigo);
    this.pagoConfirmado.set(true);
    this.mensajePago.set(
      `Pago simulado exitoso. Se generó el comprobante PDF y el QR de la compra por $${total}.`
    );
  }
}
