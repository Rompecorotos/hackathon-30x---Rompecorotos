import { requireUser } from '@/lib/auth';
import { mapSubscription, SUBSCRIPTION_COLUMNS } from '@/lib/billing';
import { dbError } from '@/lib/db';
import { handler, json, parseBody } from '@/lib/http';
import { subscriptionCreateSchema } from '@/lib/validation';

export const GET = handler(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .order('next_charge_date', { ascending: true })
    .limit(500);
  if (error) throw dbError(error);
  return json({ subscriptions: data.map(mapSubscription) });
});

export const POST = handler(async (request: Request) => {
  const { supabase } = await requireUser();
  const input = await parseBody(request, subscriptionCreateSchema);
  // La FK compuesta (customer_id, owner_id) rechaza clientes de otro usuario (-> 422).
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      customer_id: input.customerId,
      description: input.description,
      amount_cents: input.amountCents,
      currency: input.currency,
      billing_interval: input.billingInterval,
      next_charge_date: input.nextChargeDate,
    })
    .select(SUBSCRIPTION_COLUMNS)
    .single();
  if (error) throw dbError(error);
  return json({ subscription: mapSubscription(data) }, 201);
});
