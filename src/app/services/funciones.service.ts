import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Funcion } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class FuncionesService {
  async listarPorPelicula(peliculaId: number): Promise<Funcion[]> {
    const { data, error } = await supabase
      .from('funciones')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('fecha_hora_inicio', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Funcion[];
  }

  async obtenerPorId(id: number): Promise<Funcion | null> {
    const { data, error } = await supabase
      .from('funciones')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as Funcion | null;
  }

  async crearFuncion(funcion: Partial<Funcion>): Promise<Funcion> {
    const { data, error } = await supabase
      .from('funciones')
      .insert(funcion)
      .select()
      .single();

    if (error) throw error;
    return data as Funcion;
  }
}
