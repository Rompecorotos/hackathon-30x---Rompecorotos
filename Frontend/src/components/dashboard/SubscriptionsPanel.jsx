import React, { useState } from 'react';
import { InputField } from '../InputField';
import { SelectField } from '../SelectField';
import { api } from '../../lib/api';
import { CURRENCIES, formatDate, formatMoney, LABELS, toCents, today } from '../../lib/format';
import { Alert, EmptyRow, LinkButton, Panel, PrimaryButton, StatusBadge, Table } from './ui';

const EMPTY = { customerId: '', description: '', amount: '', currency: 'USD', billingInterval: 'monthly', nextChargeDate: today() };
const INTERVALS = ['monthly', 'weekly', 'yearly'].map((v) => ({ value: v, label: LABELS[v] }));
const STATUSES = ['active', 'paused', 'canceled'].map((v) => ({ value: v, label: LABELS[v] }));

export const SubscriptionsPanel = ({ customers, subscriptions, onChange }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const run = async (action, successMessage) => {
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      await action();
      setStatus({ type: 'success', message: successMessage });
      await onChange();
      return true;
    } catch (err) {
      setErrors(err.fields ?? {});
      setStatus({ type: 'error', message: err.message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountCents = toCents(form.amount);
    const nextErrors = {};
    if (!form.customerId) nextErrors.customerId = 'Selecciona un cliente';
    if (form.description.trim().length < 2) nextErrors.description = 'Mínimo 2 caracteres';
    if (!amountCents) nextErrors.amountCents = 'Importe inválido';
    if (!form.nextChargeDate) nextErrors.nextChargeDate = 'Fecha obligatoria';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const created = await run(
      () =>
        api.createSubscription({
          customerId: form.customerId,
          description: form.description.trim(),
          amountCents,
          currency: form.currency,
          billingInterval: form.billingInterval,
          nextChargeDate: form.nextChargeDate,
        }),
      'Suscripción creada.',
    );
    if (created) setForm({ ...EMPTY, customerId: form.customerId });
  };

  const handleStatus = (sub, newStatus) =>
    run(() => api.updateSubscription(sub.id, { status: newStatus }), `Suscripción ${LABELS[newStatus].toLowerCase()}.`);

  const handleDelete = (sub) => {
    if (!window.confirm(`¿Eliminar la suscripción "${sub.description}" y su historial de cobros?`)) return;
    run(() => api.deleteSubscription(sub.id), 'Suscripción eliminada.');
  };

  if (customers.length === 0) {
    return (
      <Panel title="Suscripciones" subtitle="Cobros recurrentes por cliente">
        <p className="text-sm text-slate-500">Crea primero un cliente para poder añadirle una suscripción.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Suscripciones" subtitle="Cobros recurrentes por cliente">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Cliente"
          name="customerId"
          value={form.customerId}
          onChange={handleChange}
          error={errors.customerId}
          required
          disabled={busy}
          options={[{ value: '', label: 'Selecciona...' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <InputField label="Descripción" name="description" value={form.description} onChange={handleChange} placeholder="Plan Pro" error={errors.description} required disabled={busy} />
        <InputField label="Importe" name="amount" value={form.amount} onChange={handleChange} placeholder="19.99" error={errors.amountCents} required disabled={busy} />
        <SelectField label="Moneda" name="currency" value={form.currency} onChange={handleChange} options={CURRENCIES.map((c) => ({ value: c, label: c }))} disabled={busy} />
        <SelectField label="Periodicidad" name="billingInterval" value={form.billingInterval} onChange={handleChange} options={INTERVALS} disabled={busy} />
        <InputField label="Próximo cobro" type="date" name="nextChargeDate" value={form.nextChargeDate} onChange={handleChange} error={errors.nextChargeDate} required disabled={busy} />
        <div className="sm:col-span-2 lg:col-span-3">
          <PrimaryButton isLoading={busy}>Añadir suscripción</PrimaryButton>
        </div>
      </form>
      <Alert type={status.type}>{status.message}</Alert>
      <Table headers={['Cliente', 'Descripción', 'Importe', 'Próximo cobro', 'Estado', 'Acciones']}>
        {subscriptions.length === 0 && <EmptyRow colSpan={6}>Aún no hay suscripciones.</EmptyRow>}
        {subscriptions.map((s) => (
          <tr key={s.id}>
            <td className="px-3 py-2.5 font-medium text-slate-900">{s.customer?.name}</td>
            <td className="px-3 py-2.5 text-slate-600">{s.description}</td>
            <td className="px-3 py-2.5 text-slate-900">
              {formatMoney(s.amountCents, s.currency)} <span className="text-xs text-slate-500">/ {LABELS[s.billingInterval]?.toLowerCase()}</span>
            </td>
            <td className="px-3 py-2.5 text-slate-600">{formatDate(s.nextChargeDate)}</td>
            <td className="px-3 py-2.5">
              <StatusBadge status={s.status} />
            </td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <select
                  aria-label="Cambiar estado"
                  value={s.status}
                  disabled={busy}
                  onChange={(e) => handleStatus(s, e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  {STATUSES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <LinkButton danger disabled={busy} onClick={() => handleDelete(s)}>
                  Eliminar
                </LinkButton>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
};
