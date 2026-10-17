import { requireUser } from '@/lib/auth';
import { CUSTOMER_COLUMNS, mapCustomer, toColumns } from '@/lib/billing';
import { dbError, idParam, type IdContext } from '@/lib/db';
import { assertSafeMutation, handler, HttpError, json, parseBody } from '@/lib/http';
import { customerUpdateSchema } from '@/lib/validation';

export const PATCH = handler(async (request: Request, { params }: IdContext) => {
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const input = await parseBody(request, customerUpdateSchema);
  const { data, error } = await supabase
    .from('customers')
    .update(toColumns(input, { name: 'name', email: 'email' }))
    .eq('id', id)
    .select(CUSTOMER_COLUMNS)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Cliente no encontrado');
  return json({ customer: mapCustomer(data) });
});

/** Elimina el cliente y, en cascada, sus suscripciones y cobros. */
export const DELETE = handler(async (request: Request, { params }: IdContext) => {
  assertSafeMutation(request);
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from('customers').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Cliente no encontrado');
  return json({ ok: true });
});
