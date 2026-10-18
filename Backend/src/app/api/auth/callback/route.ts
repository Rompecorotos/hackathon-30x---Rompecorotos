import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

// Solo rutas internas del frontend (evita redirecciones abiertas a otros dominios).
const ALLOWED_NEXT = ['/dashboard', '/forgot-password?paso=nueva'];

/**
 * Destino de los enlaces de Supabase (confirmación de email y recuperación de contraseña, flujo PKCE).
 * Canjea el código por una sesión y redirige al frontend (?next= indica a qué pantalla).
 */
export async function GET(request: NextRequest) {
  const frontend = env.frontendOrigins[0];
  const code = request.nextUrl.searchParams.get('code');
  const nextParam = request.nextUrl.searchParams.get('next') ?? '/dashboard';
  const next = ALLOWED_NEXT.includes(nextParam) ? nextParam : '/dashboard';
  const isRecovery = next.startsWith('/forgot-password');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${frontend}${next}`);
    console.warn('[auth] Fallo al canjear el código del enlace:', error.code);
  }

  return NextResponse.redirect(isRecovery ? `${frontend}/forgot-password?error=enlace` : `${frontend}/login?error=confirmacion`);
}
