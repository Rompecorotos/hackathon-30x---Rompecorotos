export const formatMoney = (cents, currency) => {
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
};

export const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });

/** Convierte "19,99" o "19.99" a céntimos enteros; null si no es válido. */
export const toCents = (value) => {
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

// Fecha local del usuario (no UTC: en América, por la tarde-noche UTC ya es "mañana").
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const CURRENCIES = ['USD', 'EUR', 'ARS', 'MXN', 'COP', 'CLP', 'PEN', 'BRL', 'UYU'];

export const LABELS = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
  active: 'Activa',
  paused: 'Pausada',
  canceled: 'Cancelada',
  pending: 'Pendiente',
  succeeded: 'Cobrado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
  recibida: 'Recibida',
  aprobada: 'Aprobada',
  pagada: 'Pagada',
  rechazada: 'Rechazada',
};

export const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  succeeded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  canceled: 'bg-slate-100 text-slate-600 border-slate-200',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  recibida: 'bg-amber-50 text-amber-700 border-amber-200',
  aprobada: 'bg-sky-50 text-sky-700 border-sky-200',
  pagada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazada: 'bg-red-50 text-red-600 border-red-200',
};
