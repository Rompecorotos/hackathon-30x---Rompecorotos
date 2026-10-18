import 'server-only';
import type { PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';
import { HttpError } from '@/lib/http';

const UNIQUE_MESSAGES: Record<string, string> = {
  customers_owner_email_key: 'Ya existe un cliente con ese email',
  invoices_owner_number_payee_key: 'Esa factura ya está registrada para este beneficiario',
  payments_one_success_per_due_date: 'Este cobro ya figura como cobrado para esa fecha',
};

/** Traduce errores de PostgREST/Postgres a HttpError sin exponer detalles internos. */
export function dbError(error: PostgrestError): HttpError {
  switch (error.code) {
    case '23505': {
      const key = Object.keys(UNIQUE_MESSAGES).find((k) => error.message.includes(k));
      return new HttpError(409, key ? UNIQUE_MESSAGES[key] : 'El registro ya existe');
    }
    case '23503':
      return new HttpError(422, 'El registro relacionado no existe');
    case '23514':
    case '22P02':
    case '22007':
    case '22008':
      return new HttpError(422, 'Datos inválidos');
    case '42501':
      return new HttpError(403, 'No tienes permiso para esta operación');
    case 'P0001':
      // Reglas de negocio de la BD (fecha vencida, límite de intentos, cobro duplicado): mensaje pensado para el usuario.
      return new HttpError(409, error.message);
    case 'PGRST205':
      // La tabla no existe en Supabase: falta ejecutar una migración de supabase/migrations.
      console.error('[db] Tabla inexistente (¿migración pendiente?):', error.message);
      return new HttpError(503, 'Falta aplicar una migración de base de datos en Supabase');
    default:
      console.error('[db] Error de base de datos:', error.code, error.message);
      return new HttpError(500, 'Error interno del servidor');
  }
}

/** Valida el parámetro [id] de la ruta. Un id inválido se trata como inexistente. */
export async function idParam(params: Promise<{ id: string }>): Promise<string> {
  const { id } = await params;
  const result = z.uuid().safeParse(id);
  if (!result.success) throw new HttpError(404, 'Recurso no encontrado');
  return result.data;
}

export type IdContext = { params: Promise<{ id: string }> };
