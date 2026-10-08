import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Pelicula, Funcion, Butaca, FuncionButaca } from './cine.model';
import { PeliculasService } from '../services/peliculas.service';
import { FuncionesService } from '../services/funciones.service';
import { ButacasService } from '../services/butacas.service';

@Injectable({ providedIn: 'root' })
export class CineStore {
  private readonly peliculasService = inject(PeliculasService);
  private readonly funcionesService = inject(FuncionesService);
  private readonly butacasService = inject(ButacasService);

  readonly peliculas = signal<Pelicula[]>([]);
  readonly funciones = signal<Funcion[]>([]);
  readonly butacas = signal<Butaca[]>([]);
  readonly disponibilidad = signal<FuncionButaca[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly peliculasActivas = computed(() => this.peliculas());
  readonly top3 = computed(() => this.peliculas().slice(0, 3));

  async cargarPeliculas(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const data = await this.peliculasService.listarPeliculas();
      this.peliculas.set(data);
    } catch (err) {
      this.error.set(this.messageFromError(err, 'No se pudieron cargar las películas.'));
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarFuncionesPorPelicula(peliculaId: number): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const data = await this.funcionesService.listarPorPelicula(peliculaId);
      this.funciones.set(data);
    } catch (err) {
      this.error.set(this.messageFromError(err, 'No se pudieron cargar las funciones.'));
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarButacasPorSala(salaId: number): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const data = await this.butacasService.listarPorSala(salaId);
      this.butacas.set(data);
    } catch (err) {
      this.error.set(this.messageFromError(err, 'No se pudieron cargar las butacas.'));
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarDisponibilidadFuncion(funcionId: number): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const data = await this.butacasService.listarDisponibilidadFuncion(funcionId);
      this.disponibilidad.set(data);
    } catch (err) {
      this.error.set(this.messageFromError(err, 'No se pudo obtener la disponibilidad.'));
    } finally {
      this.cargando.set(false);
    }
  }

  obtenerPeliculaPorId(id: number): Pelicula | undefined {
    return this.peliculas().find(p => p.id === id);
  }

  obtenerFuncionPorId(id: number): Funcion | undefined {
    return this.funciones().find(f => f.id === id);
  }

  private messageFromError(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return fallback;
  }
}
