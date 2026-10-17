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

// --- Dominio de cobros ---

export const CURRENCIES = ['USD', 'EUR', 'ARS', 'MXN', 'COP', 'CLP', 'PEN', 'BRL', 'UYU'] as const;
export const BILLING_INTERVALS = ['weekly', 'monthly', 'yearly'] as const;
export const SUBSCRIPTION_STATUSES = ['active', 'paused', 'canceled'] as const;
export const PAYMENT_STATUSES = ['pending', 'succeeded', 'failed', 'refunded'] as const;

/** Exige que un esquema de actualización parcial incluya al menos un campo. */
const nonEmpty = <T extends z.ZodObject>(schema: T) =>
  schema.refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'No hay cambios que aplicar' });

const name = fullName;
const isoDate = z.iso.date('Fecha inválida (AAAA-MM-DD)');
const amountCents = z
  .number('El importe es obligatorio')
  .int('El importe debe expresarse en céntimos')
  .positive('El importe debe ser mayor que 0')
  .max(100_000_000_000, 'Importe demasiado alto');
const description = z
  .string('La descripción es obligatoria')
  .trim()
  .min(2, 'La descripción debe tener al menos 2 caracteres')
  .max(200, 'La descripción no puede superar 200 caracteres');
const failureReason = z.string().trim().max(300, 'Máximo 300 caracteres').nullable();

export const customerCreateSchema = z.strictObject({ name, email });
export const customerUpdateSchema = nonEmpty(z.strictObject({ name: name.optional(), email: email.optional() }));

export const subscriptionCreateSchema = z.strictObject({
  customerId: z.uuid('Cliente inválido'),
  description,
  amountCents,
  currency: z.enum(CURRENCIES, 'Moneda no soportada').default('USD'),
  billingInterval: z.enum(BILLING_INTERVALS, 'Periodicidad inválida').default('monthly'),
  nextChargeDate: isoDate,
});
export const subscriptionUpdateSchema = nonEmpty(
  z.strictObject({
    description: description.optional(),
    amountCents: amountCents.optional(),
    currency: z.enum(CURRENCIES, 'Moneda no soportada').optional(),
    billingInterval: z.enum(BILLING_INTERVALS, 'Periodicidad inválida').optional(),
    status: z.enum(SUBSCRIPTION_STATUSES, 'Estado inválido').optional(),
    nextChargeDate: isoDate.optional(),
  }),
);

export const paymentCreateSchema = z.strictObject({
  subscriptionId: z.uuid('Suscripción inválida'),
  status: z.enum(PAYMENT_STATUSES, 'Estado inválido').default('pending'),
  dueDate: isoDate,
  failureReason: failureReason.optional(),
  attemptNumber: z.number().int().min(1).max(50).default(1),
});
export const paymentUpdateSchema = nonEmpty(
  z.strictObject({
    status: z.enum(PAYMENT_STATUSES, 'Estado inválido').optional(),
    dueDate: isoDate.optional(),
    failureReason: failureReason.optional(),
    attemptNumber: z.number().int().min(1).max(50).optional(),
  }),
);
