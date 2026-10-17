import { toHttpError } from '@/lib/auth-errors';
import { assertSafeMutation, handler, json } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

export const POST = handler(async (request: Request) => {
  assertSafeMutation(request);
  const supabase = await createClient();

  // scope 'local': cierra solo esta sesión y borra sus cookies.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error && error.code !== 'session_not_found') throw toHttpError(error);

  return json({ ok: true });
});
