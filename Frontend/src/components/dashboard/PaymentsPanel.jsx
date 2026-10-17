import React, { useState } from 'react';
import { InputField } from '../InputField';
import { SelectField } from '../SelectField';
import { api } from '../../lib/api';
import { formatDate, formatMoney, LABELS, today } from '../../lib/format';
import { Alert, EmptyRow, LinkButton, Panel, PrimaryButton, StatusBadge, Table } from './ui';

const EMPTY = { subscriptionId: '', status: 'succeeded', dueDate: today(), failureReason: '', attemptNumber: '1' };
const STATUSES = ['succeeded', 'failed', 'pending', 'refunded'].map((v) => ({ value: v, label: LABELS[v] }));

export const PaymentsPanel = ({ subscriptions, payments, onChange }) => {
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('');
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
    const attempt = Number(form.attemptNumber);
    const nextErrors = {};
    if (!form.subscriptionId) nextErrors.subscriptionId = 'Selecciona una suscripción';
    if (!form.dueDate) nextErrors.dueDate = 'Fecha obligatoria';
    if (!Number.isInteger(attempt) || attempt < 1 || attempt > 50) nextErrors.attemptNumber = 'Entre 1 y 50';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const created = await run(
      () =>
        api.createPayment({
          subscriptionId: form.subscriptionId,
          status: form.status,
          dueDate: form.dueDate,
          attemptNumber: attempt,
          ...(form.status === 'failed' && form.failureReason.trim() ? { failureReason: form.failureReason.trim() } : {}),
        }),
      'Cobro registrado.',
    );
    if (created) setForm({ ...EMPTY, subscriptionId: form.subscriptionId });
  };

  const handleDelete = (payment) => {
    if (!window.confirm('¿Eliminar este cobro del historial?')) return;
    run(() => api.deletePayment(payment.id), 'Cobro eliminado.');
  };

  if (subscriptions.length === 0) {
    return (
      <Panel title="Cobros" subtitle="Historial de intentos de cobro">
        <p className="text-sm text-slate-500">Crea primero una suscripción para registrar sus cobros.</p>
      </Panel>
    );
  }

  const visible = filter ? payments.filter((p) => p.status === filter) : payments;

  return (
    <Panel title="Cobros" subtitle="Historial de intentos de cobro">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Suscripción"
          name="subscriptionId"
          value={form.subscriptionId}
          onChange={handleChange}
          error={errors.subscriptionId}
          required
          disabled={busy}
          options={[
            { value: '', label: 'Selecciona...' },
            ...subscriptions.map((s) => ({
              value: s.id,
              label: `${s.customer?.name ?? ''} · ${s.description} (${formatMoney(s.amountCents, s.currency)})`,
            })),
          ]}
        />
        <SelectField label="Resultado" name="status" value={form.status} onChange={handleChange} options={STATUSES} disabled={busy} />
        <InputField label="Fecha" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} error={errors.dueDate} required disabled={busy} />
        <InputField label="Intento nº" type="number" name="attemptNumber" value={form.attemptNumber} onChange={handleChange} error={errors.attemptNumber} disabled={busy} />
        {form.status === 'failed' && (
          <div className="sm:col-span-2 lg:col-span-4">
            <InputField label="Motivo del fallo" name="failureReason" value={form.failureReason} onChange={handleChange} placeholder="Fondos insuficientes" error={errors.failureReason} disabled={busy} />
          </div>
        )}
        <div className="sm:col-span-2 lg:col-span-4">
          <PrimaryButton isLoading={busy}>Registrar cobro</PrimaryButton>
        </div>
      </form>
      <Alert type={status.type}>{status.message}</Alert>
      <div className="flex justify-end">
        <select
          aria-label="Filtrar por estado"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
        >
          <option value="">Todos los estados</option>
          {STATUSES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Table headers={['Fecha', 'Cliente', 'Suscripción', 'Importe', 'Estado', 'Detalle', 'Acciones']}>
        {visible.length === 0 && <EmptyRow colSpan={7}>No hay cobros que mostrar.</EmptyRow>}
        {visible.map((p) => (
          <tr key={p.id}>
            <td className="px-3 py-2.5 text-slate-600">{formatDate(p.dueDate)}</td>
            <td className="px-3 py-2.5 font-medium text-slate-900">{p.customer?.name}</td>
            <td className="px-3 py-2.5 text-slate-600">{p.subscription?.description}</td>
            <td className="px-3 py-2.5 text-slate-900">{formatMoney(p.amountCents, p.currency)}</td>
            <td className="px-3 py-2.5">
              <StatusBadge status={p.status} />
            </td>
            <td className="px-3 py-2.5 text-xs text-slate-500">
              Intento {p.attemptNumber}
              {p.failureReason ? ` · ${p.failureReason}` : ''}
            </td>
            <td className="space-x-3 px-3 py-2.5">
              {p.status !== 'succeeded' && (
                <LinkButton disabled={busy} onClick={() => run(() => api.updatePayment(p.id, { status: 'succeeded' }), 'Cobro marcado como cobrado.')}>
                  Marcar cobrado
                </LinkButton>
              )}
              <LinkButton danger disabled={busy} onClick={() => handleDelete(p)}>
                Eliminar
              </LinkButton>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
};
