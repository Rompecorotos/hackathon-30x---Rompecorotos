import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

/**
 * Destino del enlace de confirmación de email (flujo PKCE).
 * Canjea el código por una sesión y redirige al frontend.
 */
export async function GET(request: NextRequest) {
  const frontend = env.frontendOrigins[0];
  const code = request.nextUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${frontend}/dashboard`);
    console.warn('[auth] Fallo al canjear el código de confirmación:', error.code);
  }

  return NextResponse.redirect(`${frontend}/login?error=confirmacion`);
}
