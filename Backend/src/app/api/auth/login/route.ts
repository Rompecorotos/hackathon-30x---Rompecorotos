import { getProfile, toPublicUser } from '@/lib/auth';
import { toHttpError } from '@/lib/auth-errors';
import { handler, json, parseBody } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validation';

export const POST = handler(async (request: Request) => {
  const { email, password } = await parseBody(request, loginSchema);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toHttpError(error);

  const profile = await getProfile(supabase, data.user.id);
  return json({ user: toPublicUser(data.user), profile });
});
