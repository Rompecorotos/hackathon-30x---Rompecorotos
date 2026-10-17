import React, { useState } from 'react';
import { InputField } from '../InputField';
import { api } from '../../lib/api';
import { Alert, EmptyRow, LinkButton, Panel, PrimaryButton, Table } from './ui';

const EMPTY = { name: '', email: '' };

export const CustomersPanel = ({ customers, onChange }) => {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Mínimo 2 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Email inválido';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const data = { name: form.name.trim(), email: form.email.trim() };
      if (editingId) await api.updateCustomer(editingId, data);
      else await api.createCustomer(data);
      setStatus({ type: 'success', message: editingId ? 'Cliente actualizado.' : 'Cliente creado.' });
      reset();
      await onChange();
    } catch (err) {
      setErrors(err.fields ?? {});
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`¿Eliminar a ${customer.name}? También se eliminarán sus suscripciones y cobros.`)) return;
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      await api.deleteCustomer(customer.id);
      if (editingId === customer.id) reset();
      setStatus({ type: 'success', message: 'Cliente eliminado.' });
      await onChange();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Clientes" subtitle="Personas o empresas a las que cobras de forma recurrente">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <InputField label="Nombre" name="name" value={form.name} onChange={handleChange} error={errors.name} required disabled={busy} />
        <InputField label="Email" type="email" name="email" value={form.email} onChange={handleChange} error={errors.email} required disabled={busy} />
        <div className="flex gap-2">
          <PrimaryButton isLoading={busy}>{editingId ? 'Guardar' : 'Añadir'}</PrimaryButton>
          {editingId && <LinkButton onClick={reset}>Cancelar</LinkButton>}
        </div>
      </form>
      <Alert type={status.type}>{status.message}</Alert>
      <Table headers={['Nombre', 'Email', 'Acciones']}>
        {customers.length === 0 && <EmptyRow colSpan={3}>Aún no tienes clientes.</EmptyRow>}
        {customers.map((c) => (
          <tr key={c.id}>
            <td className="px-3 py-2.5 font-medium text-slate-900">{c.name}</td>
            <td className="px-3 py-2.5 text-slate-600">{c.email}</td>
            <td className="space-x-3 px-3 py-2.5">
              <LinkButton
                disabled={busy}
                onClick={() => {
                  setEditingId(c.id);
                  setForm({ name: c.name, email: c.email });
                  setErrors({});
                }}
              >
                Editar
              </LinkButton>
              <LinkButton danger disabled={busy} onClick={() => handleDelete(c)}>
                Eliminar
              </LinkButton>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
};
