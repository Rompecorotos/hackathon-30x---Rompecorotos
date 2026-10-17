import 'server-only';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function positiveInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const env = {
  get supabaseUrl() {
    return required('SUPABASE_URL');
  },
  get supabaseKey() {
    return required('SUPABASE_PUBLISHABLE_KEY');
  },
  /** Clave de Google AI Studio (Gemini). Opcional: sin ella el asistente responde 503. */
  get geminiApiKey() {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY || null;
  },
  get geminiModel() {
    // flash-lite: gratuito y fiable con herramientas (los "flash" completos se quedaban colgados con tool calling).
    return process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  },
  get aiDailyLimit() {
    return positiveInt('AI_DAILY_LIMIT', 50);
  },
  get aiPerMinuteLimit() {
    return positiveInt('AI_PER_MINUTE_LIMIT', 6);
  },
  /** Orígenes del frontend permitidos; el primero es el principal. */
  get frontendOrigins() {
    return required('FRONTEND_ORIGIN')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean);
  },
};
