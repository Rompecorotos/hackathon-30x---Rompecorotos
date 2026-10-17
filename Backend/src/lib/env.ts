import 'server-only';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const env = {
  get supabaseUrl() {
    return required('SUPABASE_URL');
  },
  get supabaseKey() {
    return required('SUPABASE_PUBLISHABLE_KEY');
  },
  /** Orígenes del frontend permitidos; el primero es el principal. */
  get frontendOrigins() {
    return required('FRONTEND_ORIGIN')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean);
  },
};
