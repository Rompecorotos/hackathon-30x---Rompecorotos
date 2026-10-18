import { requireUser } from '@/lib/auth';
import { mapPayment, PAYMENT_COLUMNS, toColumns } from '@/lib/billing';
import { dbError, idParam, type IdContext } from '@/lib/db';
import { assertSafeMutation, handler, HttpError, json, parseBody } from '@/lib/http';
import { paymentUpdateSchema } from '@/lib/validation';

export const PATCH = handler(async (request: Request, { params }: IdContext) => {
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const input = await parseBody(request, paymentUpdateSchema);
  const changes = toColumns(input, {
    status: 'status',
    dueDate: 'due_date',
    failureReason: 'failure_reason',
    attemptNumber: 'attempt_number',
  });
  // El motivo de fallo solo tiene sentido en cobros fallidos.
  if (input.status && input.status !== 'failed') changes.failure_reason = null;

  const { data, error } = await supabase
    .from('payments')
    .update(changes)
    .eq('id', id)
    .select(PAYMENT_COLUMNS)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Cobro no encontrado');
  return json({ payment: mapPayment(data) });
});

export const DELETE = handler(async (request: Request, { params }: IdContext) => {
  assertSafeMutation(request);
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from('payments').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Cobro no encontrado');
  return json({ ok: true });
});
