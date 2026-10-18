import { type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { INVOICE_COLUMNS, mapInvoice } from '@/lib/billing';
import { dbError } from '@/lib/db';
import { handler, HttpError, json, parseBody } from '@/lib/http';
import { INVOICE_STATUSES, invoiceCreateSchema } from '@/lib/validation';

/** Lista facturas. Filtro opcional: ?status=recibida */
export const GET = handler(async (request: NextRequest) => {
  const { supabase } = await requireUser();
  const status = request.nextUrl.searchParams.get('status');

  let query = supabase.from('invoices').select(INVOICE_COLUMNS).order('due_date', { ascending: true }).limit(500);
  if (status) {
    if (!(INVOICE_STATUSES as readonly string[]).includes(status)) throw new HttpError(422, 'Estado inválido');
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw dbError(error);
  return json({ invoices: data.map(mapInvoice) });
});

/** Registra una factura. Siempre entra como "recibida": el agente decide después. */
export const POST = handler(async (request: Request) => {
  const { supabase } = await requireUser();
  const input = await parseBody(request, invoiceCreateSchema);
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: input.invoiceNumber,
      payee: input.payee,
      amount_cents: input.amountCents,
      currency: input.currency,
      due_date: input.dueDate,
      concept: input.concept || null,
      status: 'recibida',
    })
    .select(INVOICE_COLUMNS)
    .single();
  if (error) throw dbError(error);
  return json({ invoice: mapInvoice(data) }, 201);
});
