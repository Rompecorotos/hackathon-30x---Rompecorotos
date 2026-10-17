import { type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { mapPayment, PAYMENT_COLUMNS } from '@/lib/billing';
import { dbError } from '@/lib/db';
import { handler, HttpError, json, parseBody } from '@/lib/http';
import { PAYMENT_STATUSES, paymentCreateSchema } from '@/lib/validation';

/** Lista cobros. Filtros opcionales: ?status=failed&subscriptionId=<uuid> */
export const GET = handler(async (request: NextRequest) => {
  const { supabase } = await requireUser();
  const status = request.nextUrl.searchParams.get('status');
  const subscriptionId = request.nextUrl.searchParams.get('subscriptionId');

  let query = supabase.from('payments').select(PAYMENT_COLUMNS).order('due_date', { ascending: false }).limit(500);
  if (status) {
    if (!(PAYMENT_STATUSES as readonly string[]).includes(status)) throw new HttpError(422, 'Estado inválido');
    query = query.eq('status', status);
  }
  if (subscriptionId) query = query.eq('subscription_id', subscriptionId);

  const { data, error } = await query;
  if (error) throw dbError(error);
  return json({ payments: data.map(mapPayment) });
});

/** Registra un cobro de una suscripción; importe y moneda se toman de la suscripción. */
export const POST = handler(async (request: Request) => {
  const { supabase } = await requireUser();
  const input = await parseBody(request, paymentCreateSchema);

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('amount_cents, currency')
    .eq('id', input.subscriptionId)
    .maybeSingle();
  if (subError) throw dbError(subError);
  if (!sub) throw new HttpError(422, 'La suscripción no existe', { subscriptionId: 'Suscripción no encontrada' });

  const { data, error } = await supabase
    .from('payments')
    .insert({
      subscription_id: input.subscriptionId,
      amount_cents: sub.amount_cents,
      currency: sub.currency,
      status: input.status,
      due_date: input.dueDate,
      failure_reason: input.status === 'failed' ? (input.failureReason ?? null) : null,
      attempt_number: input.attemptNumber,
    })
    .select(PAYMENT_COLUMNS)
    .single();
  if (error) throw dbError(error);
  return json({ payment: mapPayment(data) }, 201);
});
