import { requireUser } from '@/lib/auth';
import { INVOICE_COLUMNS, mapInvoice, toColumns } from '@/lib/billing';
import { dbError, idParam, type IdContext } from '@/lib/db';
import { assertSafeMutation, handler, HttpError, json, parseBody } from '@/lib/http';
import { invoiceUpdateSchema } from '@/lib/validation';

export const PATCH = handler(async (request: Request, { params }: IdContext) => {
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const input = await parseBody(request, invoiceUpdateSchema);
  const { data, error } = await supabase
    .from('invoices')
    .update(toColumns(input, { status: 'status', dueDate: 'due_date', concept: 'concept' }))
    .eq('id', id)
    .select(INVOICE_COLUMNS)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Factura no encontrada');
  return json({ invoice: mapInvoice(data) });
});

export const DELETE = handler(async (request: Request, { params }: IdContext) => {
  assertSafeMutation(request);
  const id = await idParam(params);
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from('invoices').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw new HttpError(404, 'Factura no encontrada');
  return json({ ok: true });
});
