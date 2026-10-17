import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Cliente de Supabase ligado a la sesión del usuario (cookies httpOnly).
 * Usa la clave publicable: todas las consultas pasan por RLS.
 * Debe crearse uno nuevo por petición.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, { ...options, httpOnly: true }),
        );
      },
    },
  });
}
