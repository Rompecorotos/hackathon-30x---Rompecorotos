// Evento para abrir el modal del plan desde cualquier parte (p. ej. el menú de usuario).
export const OPEN_PLAN_EVENT = 'bankly:open-plan';
export const openPlanModal = () => window.dispatchEvent(new Event(OPEN_PLAN_EVENT));
