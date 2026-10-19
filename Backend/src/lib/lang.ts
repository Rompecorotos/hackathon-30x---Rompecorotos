import 'server-only';

// Idioma de la interfaz enviado por el frontend en la cabecera x-lang (es por defecto).
const LANGUAGE_NAMES = { es: 'español', en: 'English', pt: 'português (Brasil)', it: 'italiano' } as const;
export type Lang = keyof typeof LANGUAGE_NAMES;

export function requestLang(request: Request): Lang {
  const value = (request.headers.get('x-lang') ?? 'es').slice(0, 2).toLowerCase();
  return value in LANGUAGE_NAMES ? (value as Lang) : 'es';
}

export const languageName = (lang: Lang) => LANGUAGE_NAMES[lang];
