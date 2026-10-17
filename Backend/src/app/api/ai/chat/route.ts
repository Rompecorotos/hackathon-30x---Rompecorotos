import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getProfile, requireUser } from '@/lib/auth';
import { systemPrompt } from '@/lib/ai/prompt';
import { createBillingTools } from '@/lib/ai/tools';
import { dbError } from '@/lib/db';
import { env } from '@/lib/env';
import { assertSafeMutation, handler, HttpError } from '@/lib/http';

export const maxDuration = 60;

const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOTAL_CHARS = 30_000;
const MODEL_TIMEOUT_MS = 45_000;

/** Límite por usuario (por minuto y por día) para proteger la cuota gratuita de Gemini. */
async function enforceRateLimit(supabase: SupabaseClient) {
  const count = async (ms: number) => {
    const { count, error } = await supabase
      .from('ai_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - ms).toISOString());
    if (error) throw dbError(error);
    return count ?? 0;
  };
  const [lastMinute, lastDay] = await Promise.all([count(60_000), count(86_400_000)]);
  if (lastMinute >= env.aiPerMinuteLimit) throw new HttpError(429, 'Demasiados mensajes seguidos. Espera un minuto.');
  if (lastDay >= env.aiDailyLimit) throw new HttpError(429, 'Has alcanzado el límite diario del asistente.');

  const { error } = await supabase.from('ai_requests').insert({});
  if (error) throw dbError(error);
}

const textLength = (m: UIMessage) =>
  m.parts.reduce((n, p) => n + (p.type === 'text' ? p.text.length : 0), 0);

function streamErrorMessage(error: unknown) {
  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return 'Se alcanzó el límite gratuito de Gemini. Inténtalo de nuevo en unos minutos.';
  }
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return 'El asistente tardó demasiado en responder. Inténtalo de nuevo.';
  }
  console.error('[ai] Error del modelo:', error instanceof Error ? error.message : error);
  return 'El asistente no está disponible en este momento.';
}

export const POST = handler(async (request: Request) => {
  assertSafeMutation(request);
  const apiKey = env.geminiApiKey;
  if (!apiKey) throw new HttpError(503, 'El asistente IA no está configurado');

  const { supabase, user } = await requireUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Cuerpo JSON inválido');
  }
  const validated = await safeValidateUIMessages({ messages: (body as { messages?: unknown })?.messages });
  if (!validated.success) throw new HttpError(422, 'Mensajes inválidos');

  const messages = validated.data.slice(-MAX_HISTORY);
  const last = messages.at(-1);
  if (!last || last.role !== 'user') throw new HttpError(422, 'El último mensaje debe ser del usuario');
  if (textLength(last) > MAX_MESSAGE_CHARS) throw new HttpError(422, `El mensaje no puede superar ${MAX_MESSAGE_CHARS} caracteres`);
  if (messages.reduce((n, m) => n + textLength(m), 0) > MAX_TOTAL_CHARS) {
    throw new HttpError(422, 'La conversación es demasiado larga. Empieza una nueva.');
  }

  await enforceRateLimit(supabase);

  const profile = await getProfile(supabase, user.id);
  const tools = createBillingTools(supabase);
  const google = createGoogleGenerativeAI({ apiKey });

  const result = streamText({
    model: google(env.geminiModel),
    system: systemPrompt(profile?.fullName ?? null),
    messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    stopWhen: isStepCount(5),
    maxOutputTokens: 1200,
    // Corta si el cliente se desconecta o si el modelo no termina a tiempo.
    abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(MODEL_TIMEOUT_MS)]),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, onError: streamErrorMessage }),
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });
});
