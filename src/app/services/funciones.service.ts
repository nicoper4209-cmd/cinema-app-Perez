import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Funcion } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class FuncionesService {
  private mapFuncion(row: any): Funcion {
    return {
      id: row.id,
      peliculaId: row.pelicula_id,
      salaId: row.sala_id,
      fechaHoraInicio: row.fecha_hora_inicio,
      fechaHoraFin: row.fecha_hora_fin,
      precioBase: Number(row.precio_base ?? 0),
      precioVip: Number(row.precio_vip ?? 0),
      precioAccesible: Number(row.precio_accesible ?? 0),
      creadaEn: row.creada_en,
    };
  }

  async listarPorPelicula(peliculaId: number): Promise<Funcion[]> {
    const { data, error } = await supabase
      .from('funciones')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('fecha_hora_inicio', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.mapFuncion(row));
  }

  async obtenerPorId(id: number): Promise<Funcion | null> {
    const { data, error } = await supabase
      .from('funciones')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapFuncion(data) : null;
  }

  async crearFuncion(funcion: Partial<Funcion>): Promise<Funcion> {
    const { data, error } = await supabase
      .from('funciones')
      .insert(funcion)
      .select()
      .single();

    if (error) throw error;
    return this.mapFuncion(data);
  }
}
