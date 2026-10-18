import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dbError } from '@/lib/db';
import { env } from '@/lib/env';
import { HttpError } from '@/lib/http';

/** Límite por usuario (por minuto y por día) para proteger la cuota gratuita de Gemini. */
export async function enforceAiRateLimit(supabase: SupabaseClient) {
  const count = async (ms: number) => {
    const { count, error } = await supabase
      .from('ai_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - ms).toISOString());
    if (error) throw dbError(error);
    return count ?? 0;
  };
  const [lastMinute, lastDay] = await Promise.all([count(60_000), count(86_400_000)]);
  if (lastMinute >= env.aiPerMinuteLimit) throw new HttpError(429, 'Demasiadas peticiones seguidas a la IA. Espera un minuto.');
  if (lastDay >= env.aiDailyLimit) throw new HttpError(429, 'Has alcanzado el límite diario de la IA.');

  const { error } = await supabase.from('ai_requests').insert({});
  if (error) throw dbError(error);
}
