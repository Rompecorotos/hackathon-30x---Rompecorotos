import { handler, HttpError, json, parseBody } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';
import { passwordVerifySchema } from '@/lib/validation';

/** Paso 2: valida el código OTP de recuperación. Si es correcto, deja una sesión para cambiar la contraseña. */
export const POST = handler(async (request: Request) => {
  const { email, token } = await parseBody(request, passwordVerifySchema);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  if (error || !data.session) {
    if (error?.status === 429) throw new HttpError(429, 'Demasiados intentos. Inténtalo más tarde');
    throw new HttpError(400, 'El código no es válido o ha expirado', { otpCode: 'Código incorrecto o expirado' });
  }
  return json({ ok: true });
});
