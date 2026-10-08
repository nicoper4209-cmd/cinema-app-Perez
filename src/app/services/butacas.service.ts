import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Butaca, FuncionButaca } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class ButacasService {
  async listarPorSala(salaId: number): Promise<Butaca[]> {
    const { data, error } = await supabase
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila', { ascending: true })
      .order('numero', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Butaca[];
  }

  async listarDisponibilidadFuncion(funcionId: number): Promise<FuncionButaca[]> {
    const { data, error } = await supabase
      .from('funcion_butacas')
      .select('*')
      .eq('funcion_id', funcionId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []) as FuncionButaca[];
  }

  async obtenerButaca(funcionId: number, butacaId: number): Promise<FuncionButaca | null> {
    const { data, error } = await supabase
      .from('funcion_butacas')
      .select('*')
      .eq('funcion_id', funcionId)
      .eq('butaca_id', butacaId)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as FuncionButaca | null;
  }
}
