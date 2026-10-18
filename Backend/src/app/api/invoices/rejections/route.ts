import { requireUser } from '@/lib/auth';
import { dbError } from '@/lib/db';
import { handler, json } from '@/lib/http';

/** Facturas incorrectas que la IA rechazó: total y las 20 más recientes. */
export const GET = handler(async () => {
  const { supabase } = await requireUser();
  const { data, count, error } = await supabase
    .from('invoice_rejections')
    .select('id, invoice_number, payee, amount_cents, currency, source, reason, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw dbError(error);
  return json({
    total: count ?? 0,
    rejections: data.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      payee: r.payee,
      amountCents: Number(r.amount_cents),
      currency: r.currency,
      source: r.source,
      reason: r.reason,
      createdAt: r.created_at,
    })),
  });
});
