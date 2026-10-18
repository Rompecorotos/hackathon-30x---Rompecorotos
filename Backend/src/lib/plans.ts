import 'server-only';

// Catálogo de planes de Bankly (mismos que la página /plans del frontend).
export const PLANS = [
  { id: 'starter', name: 'Starter / PYME', price: '$29', period: '/ mes + 1.2%', selfService: true },
  { id: 'pro', name: 'Pro Scale', price: '$79', period: '/ mes + 0.8%', selfService: true },
  { id: 'enterprise', name: 'Enterprise Custom', price: 'A medida', period: '', selfService: false },
] as const;

export type PlanId = (typeof PLANS)[number]['id'];

const DAY_MS = 86_400_000;
const RENEWAL_WINDOW_DAYS = 7;

type PlanRow = { plan_id: string; current_period_start: string; current_period_end: string };

/** Estado del plan del usuario para la API: activo, por vencer (≤7 días), vencido o sin plan. */
export function describePlan(row: PlanRow | null) {
  if (!row) return { state: 'sin_plan' as const, plan: null };
  const today = new Date(new Date().toISOString().slice(0, 10));
  const daysLeft = Math.round((new Date(row.current_period_end).getTime() - today.getTime()) / DAY_MS);
  const state = daysLeft < 0 ? 'vencido' : daysLeft <= RENEWAL_WINDOW_DAYS ? 'por_vencer' : 'activo';
  return {
    state,
    plan: {
      ...(PLANS.find((p) => p.id === row.plan_id) ?? PLANS[0]),
      periodStart: row.current_period_start,
      periodEnd: row.current_period_end,
      daysLeft,
    },
  };
}
