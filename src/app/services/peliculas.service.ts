import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Pelicula } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class PeliculasService {
  async listarPeliculas(): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('activa', true)
      .order('fecha_estreno', { ascending: true, nullsFirst: true });

    if (error) throw error;
    return (data ?? []) as Pelicula[];
  }

  async buscarPorGenero(genero: string): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('activa', true)
      .ilike('genero', `%${genero}%`)
      .order('titulo');

    if (error) throw error;
    return (data ?? []) as Pelicula[];
  }

  async listarProximamente(): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('es_proximamente', true)
      .eq('activa', true)
      .order('fecha_estreno', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Pelicula[];
  }

  async obtenerPorId(id: number): Promise<Pelicula | null> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as Pelicula | null;
  }

  async listarTop3(): Promise<Pelicula[]> {
    const { data, error } = await supabase
      .from('peliculas')
      .select('*')
      .eq('activa', true)
      .order('valoracion_promedio', { ascending: false })
      .limit(3);

    if (error) throw error;
    return (data ?? []) as Pelicula[];
  }
}
