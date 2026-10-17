import { getProfile, toPublicUser } from '@/lib/auth';
import { toHttpError } from '@/lib/auth-errors';
import { handler, json } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

/** Estado de sesión para el frontend: 200 con user=null si no hay sesión. */
export const GET = handler(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    // Sin sesión o token inválido/expirado: es un estado normal, no un error.
    if (!error || error.name === 'AuthSessionMissingError' || (error.status && error.status < 500)) {
      return json({ user: null, profile: null });
    }
    throw toHttpError(error);
  }

  const profile = await getProfile(supabase, data.user.id);
  return json({ user: toPublicUser(data.user), profile });
});
