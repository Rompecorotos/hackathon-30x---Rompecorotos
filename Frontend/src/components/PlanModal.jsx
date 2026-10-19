import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { OPEN_PLAN_EVENT } from '../lib/planEvents';
import { getLocale } from '../i18n';

// Se muestra automáticamente una vez por sesión de navegador y usuario.
const seenKey = (userId) => `bankly.planNotice.${userId}`;
const safeStorage = {
  get: (k) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k) => {
    try {
      sessionStorage.setItem(k, '1');
    } catch {
      /* sin almacenamiento: se mostrará de nuevo, sin más efectos */
    }
  },
};

// Teléfono de ventas (Enterprise): VITE_SALES_PHONE con prefijo internacional, p. ej. "+58 412 123 4567".
const SALES_PHONE = (import.meta.env.VITE_SALES_PHONE ?? '').trim();
const SALES_DIGITS = SALES_PHONE.replace(/\D/g, '');
const WHATSAPP_TEXT = encodeURIComponent('Hola, me interesa el plan Enterprise Custom de Bankly.');

function SalesContact() {
  return (
    <div className="shrink-0 space-y-1.5 text-right">
      <p className="text-xs font-semibold text-slate-500">Contacta con ventas</p>
      {SALES_DIGITS ? (
        <>
          <p className="text-sm font-bold text-[#2B2E4A]">{SALES_PHONE}</p>
          <div className="flex justify-end gap-1.5">
            <a
              href={`https://wa.me/${SALES_DIGITS}?text=${WHATSAPP_TEXT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-bold text-white transition hover:brightness-95"
            >
              WhatsApp
            </a>
            <a href={`tel:+${SALES_DIGITS}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-[#2B2E4A] transition hover:bg-slate-50">
              Llamar
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(getLocale(), { day: '2-digit', month: 'long', year: 'numeric' });

const btn = {
  primary:
    'rounded-xl bg-[#5BD3C7] px-4 py-2.5 text-sm font-bold text-[#2B2E4A] shadow-sm transition hover:bg-[#4ac3b7] disabled:opacity-50',
  secondary:
    'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50',
};

function headline(info) {
  if (info.state === 'sin_plan') return { title: 'Aún no tienes un plan', text: 'Adquiere un plan para empezar a automatizar tus cobros.' };
  const { plan } = info;
  if (info.state === 'vencido')
    return { title: `Tu plan ${plan.name} venció`, text: `Venció el ${formatDate(plan.periodEnd)}. Renuévalo o elige otro plan para seguir operando.` };
  const days = plan.daysLeft === 0 ? 'vence hoy' : `quedan ${plan.daysLeft} día${plan.daysLeft === 1 ? '' : 's'}`;
  return {
    title: `Tu plan: ${plan.name}`,
    text: `${plan.price} ${plan.period} · Vigente hasta el ${formatDate(plan.periodEnd)} (${days}).${info.state === 'por_vencer' ? ' Te recomendamos renovarlo.' : ''}`,
  };
}

export const PlanModal = () => {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('summary'); // summary | choose
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const load = useCallback(() => api.getPlan().then(setInfo), []);

  // Al iniciar sesión: cargar el plan y abrir el aviso si no se vio en esta sesión.
  useEffect(() => {
    if (!user) return;
    api
      .getPlan()
      .then((data) => {
        setInfo(data);
        if (!safeStorage.get(seenKey(user.id))) setOpen(true);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const onOpen = () => {
      setStatus({ type: '', message: '' });
      setView('summary');
      setOpen(true);
      load().catch(() => {});
    };
    window.addEventListener(OPEN_PLAN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PLAN_EVENT, onOpen);
  }, [load]);

  const close = useCallback(() => {
    if (user) safeStorage.set(seenKey(user.id));
    setOpen(false);
    setView('summary');
    setStatus({ type: '', message: '' });
  }, [user]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const run = async (action, planId, success) => {
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const data = await api.updatePlan(action, planId);
      setInfo((prev) => ({ ...prev, ...data }));
      setView('summary');
      setStatus({ type: 'success', message: typeof success === 'function' ? success(data) : success });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (!open || !info) return null;

  const { title, text } = headline(info);
  const hasPlan = info.state !== 'sin_plan';
  const choosing = !hasPlan || view === 'choose';
  const options = info.catalog.filter((p) => !hasPlan || p.id !== info.plan.id);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-labelledby="plan-title" className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="plan-title" className="text-xl font-extrabold text-[#2B2E4A]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={close} className="text-2xl leading-none text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>

        {status.message && (
          <p
            role={status.type === 'error' ? 'alert' : 'status'}
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.type === 'error' ? 'border-red-200 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {status.message}
          </p>
        )}

        {choosing ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#2B2E4A]">{hasPlan ? 'Cambiar a:' : 'Elige tu plan:'}</p>
            {options.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-bold text-[#2B2E4A]">{p.name}</p>
                  <p className="text-sm text-slate-500">
                    {p.price} {p.period}
                  </p>
                </div>
                {p.selfService ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(hasPlan ? 'change' : 'subscribe', p.id, hasPlan ? `Cambiaste al plan ${p.name}.` : `¡Listo! Ya tienes el plan ${p.name}.`)
                    }
                    className={btn.primary}
                  >
                    {hasPlan ? 'Cambiar' : 'Adquirir'}
                  </button>
                ) : (
                  <SalesContact />
                )}
              </div>
            ))}
            {hasPlan && (
              <button type="button" onClick={() => setView('summary')} className="text-sm font-semibold text-slate-500 hover:underline">
                ← Volver
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {info.plan.selfService && (
              <button type="button" disabled={busy} onClick={() => run('renew', null, (data) => `Plan renovado hasta el ${formatDate(data.plan.periodEnd)}.`)} className={btn.primary}>
                {busy ? 'Procesando...' : 'Renovar 1 mes'}
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => setView('choose')} className={btn.secondary}>
              Cambiar de plan
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-400">Activación inmediata sin cobro (modo demostración: aún no hay pasarela de pago).</p>
          <button type="button" onClick={close} className="shrink-0 text-sm font-semibold text-slate-600 hover:underline">
            {hasPlan ? 'Continuar' : 'Ahora no'}
          </button>
        </div>
      </div>
    </div>
  );
};
