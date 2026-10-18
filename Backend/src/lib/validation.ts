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
    // Distingue mayúsculas/minúsculas y exige caracteres especiales (nunca se normaliza ni se recorta).
    .regex(/[a-zñ]/, 'La contraseña debe incluir al menos una letra minúscula')
    .regex(/[A-ZÑ]/, 'La contraseña debe incluir al menos una letra mayúscula')
    .regex(/\d/, 'La contraseña debe incluir al menos un número')
    .regex(/[^A-Za-z0-9ñÑ\s]/, 'La contraseña debe incluir al menos un carácter especial (p. ej. ! @ # $ % & *)'),
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
// Fecha de hoy o futura (la BD lo vuelve a comprobar con un trigger). Se admite "ayer" en UTC
// porque el servidor está en UTC y en América "hoy" puede ser todavía el día anterior.
const futureDate = isoDate.refine(
  (d) => d >= new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
  'La fecha del próximo cobro ya está vencida: elige hoy o una fecha futura',
);
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
  nextChargeDate: futureDate,
});
export const subscriptionUpdateSchema = nonEmpty(
  z.strictObject({
    description: description.optional(),
    amountCents: amountCents.optional(),
    currency: z.enum(CURRENCIES, 'Moneda no soportada').optional(),
    billingInterval: z.enum(BILLING_INTERVALS, 'Periodicidad inválida').optional(),
    status: z.enum(SUBSCRIPTION_STATUSES, 'Estado inválido').optional(),
    nextChargeDate: futureDate.optional(),
  }),
);

// --- Facturas ---

export const INVOICE_STATUSES = ['recibida', 'aprobada', 'pagada', 'rechazada'] as const;
const concept = z.string().trim().max(500, 'Máximo 500 caracteres').nullable();

export const invoiceCreateSchema = z.strictObject({
  invoiceNumber: z.string('El número de factura es obligatorio').trim().min(1, 'Escribe el número de factura').max(60, 'Máximo 60 caracteres'),
  payee: z.string('El beneficiario es obligatorio').trim().min(2, 'Mínimo 2 caracteres').max(160, 'Máximo 160 caracteres'),
  amountCents: amountCents,
  currency: z.enum(CURRENCIES, 'Moneda no soportada').default('USD'),
  dueDate: isoDate,
  concept: concept.optional(),
});
export const invoiceUpdateSchema = nonEmpty(
  z.strictObject({
    status: z.enum(INVOICE_STATUSES, 'Estado inválido').optional(),
    dueDate: isoDate.optional(),
    concept: concept.optional(),
  }),
);

// --- Recuperación de contraseña (OTP por email) ---

export const passwordForgotSchema = z.strictObject({ email });
export const passwordVerifySchema = z.strictObject({
  email,
  token: z.string('El código es obligatorio').trim().regex(/^\d{6,10}$/, 'Código inválido'),
});
export const passwordResetSchema = z.strictObject({ password: registerSchema.shape.password });

export const paymentCreateSchema = z.strictObject({
  subscriptionId: z.uuid('Suscripción inválida'),
  status: z.enum(PAYMENT_STATUSES, 'Estado inválido').default('pending'),
  dueDate: isoDate,
  failureReason: failureReason.optional(),
});
export const paymentUpdateSchema = nonEmpty(
  z.strictObject({
    status: z.enum(PAYMENT_STATUSES, 'Estado inválido').optional(),
    dueDate: isoDate.optional(),
    failureReason: failureReason.optional(),
  }),
);
