import 'server-only';

// Columnas y mapeo snake_case (BD) -> camelCase (API) del dominio de cobros.

export const CUSTOMER_COLUMNS = 'id, name, email, created_at, updated_at';
export const SUBSCRIPTION_COLUMNS =
  'id, customer_id, description, amount_cents, currency, billing_interval, status, next_charge_date, created_at, updated_at, customer:customers(id, name, email)';
export const PAYMENT_COLUMNS =
  'id, subscription_id, amount_cents, currency, status, failure_reason, due_date, attempt_number, created_at, updated_at, subscription:subscriptions(id, description, customer:customers(id, name, email))';

export const INVOICE_COLUMNS =
  'id, invoice_number, payee, amount_cents, currency, due_date, concept, status, source, ai_verdict, ai_explanation, created_at, updated_at';

type Row = Record<string, unknown>;

export const mapInvoice = (r: Row) => ({
  id: r.id as string,
  invoiceNumber: r.invoice_number as string,
  payee: r.payee as string,
  amountCents: Number(r.amount_cents),
  currency: r.currency as string,
  dueDate: r.due_date as string,
  concept: (r.concept as string | null) ?? null,
  status: r.status as string,
  source: r.source as string,
  aiVerdict: r.ai_verdict as string,
  aiExplanation: (r.ai_explanation as string | null) ?? null,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});
type CustomerRef = { id: string; name: string; email: string } | null;

export const mapCustomer = (r: Row) => ({
  id: r.id as string,
  name: r.name as string,
  email: r.email as string,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

export const mapSubscription = (r: Row) => ({
  id: r.id as string,
  customerId: r.customer_id as string,
  customer: (r.customer as CustomerRef) ?? null,
  description: r.description as string,
  amountCents: Number(r.amount_cents),
  currency: r.currency as string,
  billingInterval: r.billing_interval as string,
  status: r.status as string,
  nextChargeDate: r.next_charge_date as string,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

export const mapPayment = (r: Row) => {
  const sub = r.subscription as { id: string; description: string; customer: CustomerRef } | null;
  return {
    id: r.id as string,
    subscriptionId: r.subscription_id as string,
    subscription: sub ? { id: sub.id, description: sub.description } : null,
    customer: sub?.customer ?? null,
    amountCents: Number(r.amount_cents),
    currency: r.currency as string,
    status: r.status as string,
    failureReason: (r.failure_reason as string | null) ?? null,
    dueDate: r.due_date as string,
    attemptNumber: r.attempt_number as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
};

/** Convierte claves camelCase de la API a columnas de la BD, ignorando undefined. */
export function toColumns(input: Record<string, unknown>, map: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(map)) {
    if (input[key] !== undefined) out[column] = input[key];
  }
  return out;
}
