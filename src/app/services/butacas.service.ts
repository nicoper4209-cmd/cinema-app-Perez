import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Butaca, FuncionButaca } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class ButacasService {
  private mapButaca(row: any): Butaca {
    return {
      id: Number(row.id),
      salaId: Number(row.sala_id ?? row.salaId),
      fila: String(row.fila),
      numero: Number(row.numero),
      tipo: row.tipo,
      precio: Number(row.precio ?? 0),
    };
  }

  private mapDisponibilidad(row: any): FuncionButaca {
    return {
      id: Number(row.id),
      funcionId: Number(row.funcion_id ?? row.funcionId),
      butacaId: Number(row.butaca_id ?? row.butacaId),
      estado: row.estado,
      precioFinal: Number(row.precio_final ?? row.precioFinal ?? 0),
    };
  }

  async listarPorSala(salaId: number): Promise<Butaca[]> {
    const { data, error } = await supabase
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila', { ascending: true })
      .order('numero', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.mapButaca(row));
  }

  async listarDisponibilidadFuncion(funcionId: number): Promise<FuncionButaca[]> {
    const { data, error } = await supabase
      .from('funcion_butacas')
      .select('*')
      .eq('funcion_id', funcionId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.mapDisponibilidad(row));
  }

  async obtenerButaca(funcionId: number, butacaId: number): Promise<FuncionButaca | null> {
    const { data, error } = await supabase
      .from('funcion_butacas')
      .select('*')
      .eq('funcion_id', funcionId)
      .eq('butaca_id', butacaId)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapDisponibilidad(data) : null;
  }
}
