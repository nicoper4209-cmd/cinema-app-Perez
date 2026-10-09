import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CineStore } from '../cine-store.service';
import { Pelicula, Funcion } from '../cine.model';

@Component({
  selector: 'app-detalle-pelicula',
  imports: [RouterLink, DatePipe],
  templateUrl: './detalle-pelicula.html',
  styleUrl: './detalle-pelicula.css',
})
export class DetallePelicula implements OnInit {
  private readonly store = inject(CineStore);

  peliculaId = input<number>(0, {
    transform: (value: unknown) => Number(value ?? 0),
  });

  readonly pelicula = computed<Pelicula | undefined>(() => {
    const id = this.peliculaId();
    return this.store.peliculas().find((item) => item.id === id);
  });

  readonly funciones = computed<Funcion[]>(() => {
    const id = this.peliculaId();
    return this.store.funciones().filter((item) => item.peliculaId === id);
  });

  readonly cargando = this.store.cargando;
  readonly error = this.store.error;

  irAFunciones(): void {
    document.getElementById('funciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnInit(): void {
    const id = this.peliculaId();
    void this.store.cargarFuncionesPorPelicula(id);
  }
}
