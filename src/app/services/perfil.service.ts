import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { PerfilUsuario } from '../cine/cine.model';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  async obtenerPerfilActual(): Promise<PerfilUsuario | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as PerfilUsuario | null;
  }

  async crearOActualizarPerfil(perfil: Partial<PerfilUsuario>): Promise<PerfilUsuario> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('No hay usuario autenticado.');

    const payload = {
      ...perfil,
      id: userData.user.id,
      email: perfil.email ?? userData.user.email,
      nombre: perfil.nombre ?? userData.user.user_metadata?.['full_name'] ?? 'Usuario',
      actualizado_en: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('perfiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data as PerfilUsuario;
  }
}
