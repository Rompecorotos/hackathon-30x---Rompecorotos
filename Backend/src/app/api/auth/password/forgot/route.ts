import { isAuthError } from '@supabase/supabase-js';
import { toHttpError } from '@/lib/auth-errors';
import { env } from '@/lib/env';
import { handler, json, parseBody } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';
import { passwordForgotSchema } from '@/lib/validation';

/**
 * Paso 1 de "¿Olvidaste tu contraseña?": Supabase envía un email con el código OTP
 * (la plantilla "Reset Password" debe incluir {{ .Token }}).
 * Responde igual exista o no la cuenta, para no permitir enumerar emails.
 */
export const POST = handler(async (request: Request) => {
  const { email } = await parseBody(request, passwordForgotSchema);
  const supabase = await createClient();
  // El email por defecto de Supabase trae un enlace: vuelve por /api/auth/callback y
  // de ahí al paso "Nueva contraseña" (no requiere SMTP propio ni editar plantillas).
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.frontendOrigins[0]}/api/auth/callback?next=/forgot-password?paso=nueva`,
  });
  if (error) {
    const http = toHttpError(error);
    // Solo se informan límites de envío y caídas; el resto se oculta.
    if (http.status === 429 || http.status >= 500 || !isAuthError(error)) throw http;
    console.warn('[auth] resetPasswordForEmail:', error.code);
  }
  return json({ ok: true });
});
