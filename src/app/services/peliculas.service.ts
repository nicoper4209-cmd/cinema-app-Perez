import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Pelicula } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class PeliculasService {
  private mapPelicula(row: any): Pelicula {
    return {
      id: row.id,
      titulo: row.titulo,
      sinopsis: row.sinopsis ?? null,
      duracionMinutos: row.duracion_minutos,
      genero: row.genero,
      clasificacion: row.clasificacion,
      trailerUrl: row.trailer_url ?? null,
      posterUrl: row.poster_url ?? null,
      fechaEstreno: row.fecha_estreno ?? null,
      activa: row.activa,
      esProximamente: row.es_proximamente,
      valoracionPromedio: Number(row.valoracion_promedio ?? 0),
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en,
    };
  }

  async listarPeliculas(): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('activa', true)
      .order('fecha_estreno', { ascending: true, nullsFirst: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.mapPelicula(row));
  }

  async buscarPorGenero(genero: string): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('activa', true)
      .ilike('genero', `%${genero}%`)
      .order('titulo');

    if (error) throw error;
    return (data ?? []).map((row) => this.mapPelicula(row));
  }

  async listarProximamente(): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('es_proximamente', true)
      .eq('activa', true)
      .order('fecha_estreno', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.mapPelicula(row));
  }

  async obtenerPorId(id: number): Promise<Pelicula | null> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapPelicula(data) : null;
  }

  async listarTop3(): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('activa', true)
      .order('valoracion_promedio', { ascending: false })
      .limit(3);

    if (error) throw error;
    return (data ?? []).map((row) => this.mapPelicula(row));
  }
}
