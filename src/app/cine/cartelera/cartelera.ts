import { Component, computed, inject, input, OnInit } from '@angular/core';
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

  readonly vista = input<'cartelera' | 'top3' | 'proximamente'>('cartelera');
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
  readonly peliculasVisibles = computed(() => {
    switch (this.vista()) {
      case 'top3': return this.top3();
      case 'proximamente': return this.proximamente();
      default: return this.enCartelera();
    }
  });
  readonly titulo = computed(() => ({
    cartelera: 'Cartelera',
    top3: 'Top 3',
    proximamente: 'Próximamente',
  })[this.vista()]);
  readonly mensajeVacio = computed(() => ({
    cartelera: 'Todavía no hay películas en cartelera.',
    top3: 'Todavía no hay películas para mostrar en el Top 3.',
    proximamente: 'No hay estrenos próximos.',
  })[this.vista()]);

  ngOnInit(): void {
    void this.store.cargarPeliculas();
  }
}
