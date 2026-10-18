// Reglas de contraseña nueva (mismas que el backend en src/lib/validation.ts).
// La contraseña distingue mayúsculas/minúsculas y nunca se recorta ni se normaliza.
export const PASSWORD_HELP = 'Mínimo 8 caracteres, con mayúscula, minúscula, número y un carácter especial (! @ # $ % & *…)';

export function passwordError(pw) {
  if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (pw.length > 72) return 'La contraseña no puede superar 72 caracteres';
  if (!/[a-zñ]/.test(pw)) return 'Incluye al menos una letra minúscula';
  if (!/[A-ZÑ]/.test(pw)) return 'Incluye al menos una letra mayúscula';
  if (!/\d/.test(pw)) return 'Incluye al menos un número';
  if (!/[^A-Za-z0-9ñÑ\s]/.test(pw)) return 'Incluye al menos un carácter especial (! @ # $ % & *…)';
  return null;
}
