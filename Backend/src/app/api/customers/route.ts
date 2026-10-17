import { requireUser } from '@/lib/auth';
import { CUSTOMER_COLUMNS, mapCustomer } from '@/lib/billing';
import { dbError } from '@/lib/db';
import { handler, json, parseBody } from '@/lib/http';
import { customerCreateSchema } from '@/lib/validation';

export const GET = handler(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw dbError(error);
  return json({ customers: data.map(mapCustomer) });
});

export const POST = handler(async (request: Request) => {
  const { supabase } = await requireUser();
  const input = await parseBody(request, customerCreateSchema);
  // owner_id lo asigna la BD con auth.uid(); RLS impide suplantarlo.
  const { data, error } = await supabase.from('customers').insert(input).select(CUSTOMER_COLUMNS).single();
  if (error) throw dbError(error);
  return json({ customer: mapCustomer(data) }, 201);
});
