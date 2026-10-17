import 'server-only';
import { isAuthError, type AuthError } from '@supabase/supabase-js';
import { HttpError } from '@/lib/http';

const KNOWN: Record<string, [number, string]> = {
  invalid_credentials: [401, 'Email o contraseña incorrectos'],
  email_not_confirmed: [403, 'Debes confirmar tu email antes de ingresar'],
  user_already_exists: [409, 'Ya existe una cuenta con ese email'],
  email_exists: [409, 'Ya existe una cuenta con ese email'],
  weak_password: [422, 'La contraseña es demasiado débil'],
  email_address_invalid: [422, 'Email inválido'],
  signup_disabled: [403, 'El registro está deshabilitado'],
  over_request_rate_limit: [429, 'Demasiados intentos. Inténtalo de nuevo más tarde'],
  over_email_send_rate_limit: [429, 'Demasiados emails enviados. Inténtalo de nuevo más tarde'],
};

/** Traduce un error de Supabase Auth a un HttpError sin filtrar detalles internos. */
export function toHttpError(error: AuthError | unknown): HttpError {
  if (isAuthError(error)) {
    const known = error.code && KNOWN[error.code];
    if (known) return new HttpError(known[0], known[1]);
    // status 0 / 5xx: Supabase inaccesible o caído.
    if (!error.status || error.status >= 500) {
      console.error('[auth] Supabase no disponible:', error.message);
      return new HttpError(503, 'Servicio de autenticación no disponible');
    }
    console.warn('[auth] Error no mapeado:', error.code, error.message);
    return new HttpError(400, 'No se pudo completar la operación');
  }
  console.error('[auth] Error inesperado:', error);
  return new HttpError(500, 'Error interno del servidor');
}
