import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
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

  seleccionada = new Set<number>();

  constructor() {
    const id = this.funcionId();
    if (id) {
      void this.store.cargarDisponibilidadFuncion(id);
    }
  }

  toggleButaca(butaca: Butaca): void {
    if (this.seleccionada.has(butaca.id)) {
      this.seleccionada.delete(butaca.id);
      return;
    }

    this.seleccionada.add(butaca.id);
  }

  isSeleccionada(butacaId: number): boolean {
    return this.seleccionada.has(butacaId);
  }

  costoTotal(): number {
    const seleccionadas = Array.from(this.seleccionada);
    if (!seleccionadas.length) return 0;

    return this.butacas()
      .filter((butaca) => seleccionadas.includes(butaca.id))
      .reduce((total, butaca) => total + butaca.precio, 0);
  }
}
