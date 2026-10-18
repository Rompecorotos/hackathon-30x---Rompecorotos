import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { dbError } from '@/lib/db';
import { handler, HttpError, json, parseBody } from '@/lib/http';
import { describePlan, PLANS } from '@/lib/plans';

const planActionSchema = z.strictObject({
  action: z.enum(['subscribe', 'renew', 'change'], 'Acción inválida'),
  planId: z.enum(['starter', 'pro'], 'Plan no disponible para contratación directa').optional(),
});

/** Plan actual del usuario, su estado y el catálogo disponible. */
export const GET = handler(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('account_plans')
    .select('plan_id, current_period_start, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw dbError(error);
  return json({ ...describePlan(data), catalog: PLANS });
});

/**
 * Contratar, renovar o cambiar de plan. Las fechas las calcula la BD (set_account_plan).
 * Sin pasarela de pago: activación inmediata (modo demostración).
 */
export const POST = handler(async (request: Request) => {
  const { supabase } = await requireUser();
  const { action, planId } = await parseBody(request, planActionSchema);
  if (action !== 'renew' && !planId) throw new HttpError(422, 'Elige un plan', { planId: 'Elige un plan' });

  const { data, error } = await supabase.rpc('set_account_plan', { p_action: action, p_plan: planId ?? null }).single();
  if (error) {
    // Errores de negocio lanzados por la función (plan activo, sin plan, mismo plan...).
    if (['P0001', 'P0002', '22023'].includes(error.code)) throw new HttpError(409, error.message);
    throw dbError(error);
  }
  return json(describePlan(data as never));
});
