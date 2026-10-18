import { requireUser } from '@/lib/auth';
import { mapSubscription, SUBSCRIPTION_COLUMNS, toColumns } from '@/lib/billing';
import { dbError, idParam, type IdContext } from '@/lib/db';
import { assertSafeMutation, handler, HttpError, json, parseBody } from '@/lib/http';
import { subscriptionUpdateSchema } from '@/lib/validation';

export const PATCH = handler(async (request: Request, { params }: IdContext) => {
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const input = await parseBody(request, subscriptionUpdateSchema);
  const { data, error } = await supabase
    .from('subscriptions')
    .update(
      toColumns(input, {
        description: 'description',
        amountCents: 'amount_cents',
        currency: 'currency',
        billingInterval: 'billing_interval',
        status: 'status',
        nextChargeDate: 'next_charge_date',
      }),
    )
    .eq('id', id)
    .select(SUBSCRIPTION_COLUMNS)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Suscripción no encontrada');
  return json({ subscription: mapSubscription(data) });
});

/** Elimina la suscripción y, en cascada, sus cobros. */
export const DELETE = handler(async (request: Request, { params }: IdContext) => {
  assertSafeMutation(request);
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from('subscriptions').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Suscripción no encontrada');
  return json({ ok: true });
});
