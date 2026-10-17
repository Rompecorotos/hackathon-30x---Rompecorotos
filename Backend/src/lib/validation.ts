import { z } from 'zod';

const email = z
  .string('El email es obligatorio')
  .trim()
  .toLowerCase()
  .max(254, 'Email demasiado largo')
  .pipe(z.email('Email inválido'));

const fullName = z
  .string('El nombre es obligatorio')
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(120, 'El nombre no puede superar 120 caracteres');

export const registerSchema = z.object({
  fullName,
  email,
  password: z
    .string('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar 72 caracteres')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/\d/, 'La contraseña debe incluir al menos un número'),
});

export const loginSchema = z.object({
  email,
  password: z.string('La contraseña es obligatoria').min(1, 'La contraseña es obligatoria').max(72),
});

export const profileUpdateSchema = z.strictObject({ fullName });

