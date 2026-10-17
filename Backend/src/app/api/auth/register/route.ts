import { getProfile, toPublicUser } from '@/lib/auth';
import { toHttpError } from '@/lib/auth-errors';
import { env } from '@/lib/env';
import { handler, json, parseBody } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';
import { registerSchema } from '@/lib/validation';

export const POST = handler(async (request: Request) => {
  const { fullName, email, password } = await parseBody(request, registerSchema);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // El trigger handle_new_user crea el perfil a partir de este metadato.
      data: { full_name: fullName },
      emailRedirectTo: `${env.frontendOrigins[0]}/api/auth/callback`,
    },
  });
  if (error) throw toHttpError(error);

  // Con confirmación de email activa no hay sesión. Supabase devuelve la misma
  // respuesta si el email ya existe, así evitamos enumerar cuentas.
  if (!data.session || !data.user) {
    return json({ user: null, profile: null, needsConfirmation: true }, 202);
  }

  const profile = await getProfile(supabase, data.user.id);
  return json({ user: toPublicUser(data.user), profile, needsConfirmation: false }, 201);
});
