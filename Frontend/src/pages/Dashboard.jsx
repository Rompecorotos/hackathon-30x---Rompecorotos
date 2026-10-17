import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CustomersPanel } from '../components/dashboard/CustomersPanel';
import { SubscriptionsPanel } from '../components/dashboard/SubscriptionsPanel';
import { PaymentsPanel } from '../components/dashboard/PaymentsPanel';
import { Alert } from '../components/dashboard/ui';
import { RouteLoader } from '../routes/RouteLoader';

const TABS = [
  { id: 'customers', label: 'Clientes' },
  { id: 'subscriptions', label: 'Suscripciones' },
  { id: 'payments', label: 'Cobros' },
];

async function fetchAll() {
  try {
    const [c, s, p] = await Promise.all([api.listCustomers(), api.listSubscriptions(), api.listPayments()]);
    return { data: { customers: c.customers, subscriptions: s.subscriptions, payments: p.payments } };
  } catch (err) {
    return { error: err.message };
  }
}

export const Dashboard = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState('customers');
  const [data, setData] = useState({ customers: [], subscriptions: [], payments: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const applyResult = useCallback((result) => {
    if (result.error) setError(result.error);
    else {
      setData(result.data);
      setError('');
    }
    setIsLoading(false);
  }, []);

  const load = useCallback(async () => applyResult(await fetchAll()), [applyResult]);

  useEffect(() => {
    let active = true;
    fetchAll().then((result) => active && applyResult(result));
    return () => {
      active = false;
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
          Gestiona tus clientes, suscripciones y cobros. Pregunta al asistente IA (abajo a la derecha) para analizarlos.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:gap-6 sm:p-6">
        {[
          ['Clientes', data.customers.length],
          ['Suscripciones activas', active],
          ['Cobros fallidos', failed],
        ].map(([label, value]) => (
          <div key={label} className="text-center">
            <p className="text-2xl font-black text-slate-900 sm:text-3xl">{isLoading ? '–' : value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">{label}</p>
          </div>
        ))}
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
          {tab === 'payments' && (
            <PaymentsPanel subscriptions={data.subscriptions} payments={data.payments} onChange={load} />
          )}
        </>
      )}
    </div>
  );
};
