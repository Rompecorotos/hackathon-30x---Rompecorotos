import { requireUser } from '@/lib/auth';
import { toHttpError } from '@/lib/auth-errors';
import { handler, HttpError, json, parseBody } from '@/lib/http';
import { passwordResetSchema } from '@/lib/validation';

/** Paso 3: fija la nueva contraseña (requiere la sesión creada al verificar el código). */
export const POST = handler(async (request: Request) => {
  const { supabase } = await requireUser();
  const { password } = await parseBody(request, passwordResetSchema);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'same_password') throw new HttpError(422, 'La nueva contraseña debe ser distinta de la anterior', { password: 'Usa una contraseña distinta' });
    throw toHttpError(error);
  }
  return json({ ok: true });
});
