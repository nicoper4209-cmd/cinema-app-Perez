import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Pedido, Entrada, Funcion, ProductoCandy } from '../cine/cine.model';

export interface EntradaConfirmada {
  entradaId: number;
  butacaId: number;
  codigoQr: string;
  precio: number;
}

export interface CompraConfirmada {
  pedidoId: number;
  total: number;
  descuentoAplicado: number;
  puntosUsados: number;
  puntosObtenidos: number;
  entradas: EntradaConfirmada[];
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  async confirmarCompraEntradas(datos: {
    funcionId: number;
    butacasIds: number[];
    compradorNombre: string;
    compradorEmail: string;
    fechaNacimiento: string;
    codigoCupon: string;
    puntosUsar: number;
  }): Promise<CompraConfirmada> {
    const { data, error } = await supabase.rpc('confirmar_compra_entradas', {
      p_funcion_id: datos.funcionId,
      p_butacas_ids: datos.butacasIds,
      p_comprador_nombre: datos.compradorNombre,
      p_comprador_email: datos.compradorEmail,
      p_fecha_nacimiento: datos.fechaNacimiento,
      p_codigo_cupon: datos.codigoCupon || null,
      p_puntos_a_usar: datos.puntosUsar,
    });

    if (error) throw error;
    return data as CompraConfirmada;
  }

  async obtenerSaldoPuntos(): Promise<number> {
    const { data: usuario, error: errorUsuario } = await supabase.auth.getUser();
    if (errorUsuario) throw errorUsuario;
    if (!usuario.user) return 0;

    const { data, error } = await supabase
      .from('puntos_usuario')
      .select('saldo')
      .eq('usuario_id', usuario.user.id)
      .maybeSingle();

    if (error) throw error;
    return Number(data?.saldo ?? 0);
  }

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
