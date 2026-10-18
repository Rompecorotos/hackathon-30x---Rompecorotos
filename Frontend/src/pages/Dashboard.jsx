import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CustomersPanel } from '../components/dashboard/CustomersPanel';
import { SubscriptionsPanel } from '../components/dashboard/SubscriptionsPanel';
import { PaymentsPanel } from '../components/dashboard/PaymentsPanel';
import { InvoicesPanel } from '../components/dashboard/InvoicesPanel';
import { Alert } from '../components/dashboard/ui';
import { RouteLoader } from '../routes/RouteLoader';

const REFRESH_MS = 8000;

const TABS = [
  { id: 'customers', label: 'Clientes' },
  { id: 'subscriptions', label: 'Suscripciones' },
  { id: 'payments', label: 'Cobros' },
  { id: 'invoices', label: 'Facturas' },
];

async function fetchAll() {
  try {
    const [c, s, p, i, r] = await Promise.all([
      api.listCustomers(),
      api.listSubscriptions(),
      api.listPayments(),
      api.listInvoices(),
      api.listInvoiceRejections().catch(() => ({ total: 0, rejections: [] })), // tolera la migración pendiente
    ]);
    return {
      data: {
        customers: c.customers,
        subscriptions: s.subscriptions,
        payments: p.payments,
        invoices: i.invoices,
        rejections: r.rejections,
        rejectionsTotal: r.total,
      },
    };
  } catch (err) {
    return { error: err.message };
  }
}

export const Dashboard = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState('customers');
  const [data, setData] = useState({ customers: [], subscriptions: [], payments: [], invoices: [], rejections: [], rejectionsTotal: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const applyResult = useCallback((result) => {
    if (result.error) setError(result.error);
    else {
      setData(result.data);
      setError('');
      setUpdatedAt(new Date());
    }
    setIsLoading(false);
  }, []);

  const load = useCallback(async () => applyResult(await fetchAll()), [applyResult]);

  // Tiempo real: refresca cada 8 s mientras la pestaña está visible y al volver a ella.
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (document.visibilityState === 'visible') fetchAll().then((result) => active && applyResult(result));
    };
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [applyResult]);

  const failed = data.payments.filter((p) => p.status === 'failed').length;
  const active = data.subscriptions.filter((s) => s.status === 'active').length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-4 sm:py-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B2E4A] sm:text-3xl">
          Mi Panel{profile?.fullName ? ` · ${profile.fullName}` : ''}
        </h1>
        <p className="text-sm text-slate-500">
          Gestiona tus clientes, suscripciones, cobros y facturas. Pregunta al asistente IA (abajo a la derecha) para analizarlos.
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-4 sm:gap-6 sm:p-6">
          {[
            ['Clientes', data.customers.length],
            ['Suscripciones activas', active],
            ['Cobros fallidos', failed],
            ['Facturas incorrectas', data.rejectionsTotal, 'text-red-600', () => setTab('invoices')],
          ].map(([label, value, color = 'text-slate-900', onClick]) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              disabled={!onClick}
              title={onClick ? 'Ver las facturas rechazadas por la IA' : undefined}
              className="rounded-xl text-center transition enabled:hover:bg-slate-50 disabled:cursor-default"
            >
              <p className={`text-2xl font-black sm:text-3xl ${value > 0 ? color : 'text-slate-900'}`}>{isLoading ? '–' : value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">{label}</p>
            </button>
          ))}
        </div>
        <p className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
          En vivo{updatedAt ? ` · actualizado ${updatedAt.toLocaleTimeString('es')}` : ''}
        </p>
      </div>

      <Alert>{error}</Alert>

      <div role="tablist" className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-[#2B2E4A] text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <RouteLoader />
      ) : (
        <>
          {tab === 'customers' && <CustomersPanel customers={data.customers} onChange={load} />}
          {tab === 'subscriptions' && (
            <SubscriptionsPanel customers={data.customers} subscriptions={data.subscriptions} onChange={load} />
          )}
          {tab === 'invoices' && <InvoicesPanel invoices={data.invoices} rejections={data.rejections} rejectionsTotal={data.rejectionsTotal} onChange={load} />}
          {tab === 'payments' && (
            <PaymentsPanel subscriptions={data.subscriptions} payments={data.payments} onChange={load} />
          )}
        </>
      )}
    </div>
  );
};
