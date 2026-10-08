import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CineStore } from '../cine-store.service';

@Component({
  selector: 'app-cartelera',
  imports: [RouterLink],
  templateUrl: './cartelera.html',
  styleUrl: './cartelera.css',
})
export class Cartelera implements OnInit {
  private readonly store = inject(CineStore);

  readonly peliculas = this.store.peliculas;
  readonly cargando = this.store.cargando;
  readonly error = this.store.error;

  readonly top3 = computed(() => this.store.peliculas().slice(0, 3));
  readonly proximamente = computed(() =>
    this.store.peliculas().filter((p) => p.esProximamente && p.activa)
  );
  readonly enCartelera = computed(() =>
    this.store.peliculas().filter((p) => !p.esProximamente && p.activa)
  );

  ngOnInit(): void {
    void this.store.cargarPeliculas();
  }
}
