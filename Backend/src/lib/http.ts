import 'server-only';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { env } from '@/lib/env';

// Las respuestas pueden fijar cookies de sesión: nunca deben cachearse.
const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' };

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
    /** Datos adicionales que se incluyen en la respuesta de error (p. ej. la revisión de la IA). */
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return json(
      { error: error.message, ...(error.fields && { fields: error.fields }), ...error.extra },
      error.status,
    );
  }
  console.error('[api] Error inesperado:', error);
  return json({ error: 'Error interno del servidor' }, 500);
}

/** Envuelve un handler y convierte cualquier excepción en una respuesta JSON coherente. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Protección CSRF para peticiones que modifican estado: exige JSON (fuerza
 * preflight CORS en peticiones cruzadas) y un Origin permitido si el navegador lo envía.
 */
export function assertSafeMutation(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Content-Type debe ser application/json');
  }
  assertAllowedOrigin(request, false);
}

/**
 * Comprueba el Origin. Para subidas multipart (que no fuerzan preflight CORS)
 * se exige que exista: los navegadores siempre lo envían en POST.
 */
export function assertAllowedOrigin(request: Request, required: boolean) {
  const origin = request.headers.get('origin');
  if (!origin) {
    if (required) throw new HttpError(403, 'Origen no permitido');
    return;
  }
  if (origin !== new URL(request.url).origin && !env.frontendOrigins.includes(origin)) {
    throw new HttpError(403, 'Origen no permitido');
  }
}

/** Valida el cuerpo JSON con un esquema zod y devuelve los errores por campo. */
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  assertSafeMutation(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Cuerpo JSON inválido');
  }
  return validateInput(body, schema);
}

/** Valida un valor ya leído con un esquema zod y devuelve los errores por campo (422). */
export function validateInput<S extends z.ZodType>(body: unknown, schema: S): z.infer<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    throw new HttpError(422, 'Datos inválidos', fields);
  }
  return result.data;
}
