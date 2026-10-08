import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Pedido, Entrada, Funcion, ProductoCandy } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class VentasService {
  async crearPedido(pedido: Partial<Pedido>): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .insert(pedido)
      .select()
      .single();

    if (error) throw error;
    return data as Pedido;
  }

  async crearEntrada(entrada: Partial<Entrada>): Promise<Entrada> {
    const { data, error } = await supabase
      .from('entradas')
      .insert(entrada)
      .select()
      .single();

    if (error) throw error;
    return data as Entrada;
  }

  async listarProductosCandy(): Promise<ProductoCandy[]> {
    const { data, error } = await supabase
      .from('productos_candy')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;
    return (data ?? []) as ProductoCandy[];
  }

  async confirmarPedido(id: number): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: 'confirmado', actualizado_en: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Pedido;
  }

  async obtenerEntradaPorCodigo(codigo: string): Promise<Entrada | null> {
    const { data, error } = await supabase
      .from('entradas')
      .select('*')
      .eq('codigo_qr', codigo)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as Entrada | null;
  }
}
