import { type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { reviewInvoice } from '@/lib/ai/invoice-review';
import { enforceAiRateLimit } from '@/lib/ai/rate-limit';
import { INVOICE_COLUMNS, mapInvoice } from '@/lib/billing';
import { dbError } from '@/lib/db';
import { handler, HttpError, json, parseBody, validateInput } from '@/lib/http';
import { isMultipart, readDocument, readMultipart, readQr, readSource } from '@/lib/invoice-input';
import { INVOICE_STATUSES, invoiceCreateSchema } from '@/lib/validation';

export const maxDuration = 60;

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

/**
 * Registra una factura tras revisarla con IA. Formatos:
 * - JSON con los datos (modo manual).
 * - multipart: `data` (JSON), `source` (manual|imagen|pdf|qr) y opcionalmente `file` (≤4 MB) o `qr` (texto leído).
 * Si la IA decide que los datos no son correctos responde 422 con su explicación y no se guarda.
 */
export const POST = handler(async (request: Request) => {
  const { supabase } = await requireUser();

  let input;
  let source;
  let document = null;
  let qrText = null;
  if (isMultipart(request)) {
    const form = await readMultipart(request);
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get('data') ?? ''));
    } catch {
      throw new HttpError(400, 'El campo "data" debe ser JSON');
    }
    input = validateInput(raw, invoiceCreateSchema);
    source = readSource(form.get('source'));
    document = await readDocument(form.get('file'), source);
    qrText = source === 'qr' ? readQr(form.get('qr')) : null;
    if ((source === 'imagen' || source === 'pdf') && !document) throw new HttpError(422, 'Adjunta el archivo de la factura');
    if (source === 'qr' && !qrText) throw new HttpError(422, 'Falta el contenido del código QR');
  } else {
    input = await parseBody(request, invoiceCreateSchema);
    source = 'manual' as const;
  }

  // Duplicado antes de gastar una llamada a la IA (el índice único lo garantiza igualmente).
  const { data: existing, error: dupError } = await supabase
    .from('invoices')
    .select('id')
    .eq('invoice_number', input.invoiceNumber)
    .ilike('payee', input.payee.replace(/[%_\\]/g, '\\$&'))
    .limit(1);
  if (dupError) throw dbError(dupError);
  if (existing.length) throw new HttpError(409, 'Esa factura ya está registrada para este beneficiario');

  await enforceAiRateLimit(supabase);
  const review = await reviewInvoice(input, source, { document, qrText, signal: request.signal });
  if (review.verdict === 'invalida') {
    throw new HttpError(422, `La IA rechazó la factura: ${review.explanation}`, undefined, { review });
  }

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
      source,
      ai_verdict: review.verdict,
      ai_explanation: review.explanation,
    })
    .select(INVOICE_COLUMNS)
    .single();
  if (error) throw dbError(error);
  return json({ invoice: mapInvoice(data), review }, 201);
});
