import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatDate, formatMoney, LABELS, today } from '../../lib/format';
import { Alert, EmptyRow, LinkButton, Panel, StatusBadge, Table } from './ui';

const STATUSES = ['recibida', 'aprobada', 'pagada', 'rechazada'];

export const InvoicesPanel = ({ invoices, onChange }) => {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);

  const run = async (action, successMessage) => {
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      await action();
      setStatus({ type: 'success', message: successMessage });
      await onChange();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (invoice) => {
    if (!window.confirm(`¿Eliminar la factura ${invoice.invoiceNumber} de ${invoice.payee}?`)) return;
    run(() => api.deleteInvoice(invoice.id), 'Factura eliminada.');
  };

  const hoy = today();

  return (
    <Panel title="Facturas" subtitle="Facturas de proveedores por pagar. El asistente IA puede priorizarlas por vencimiento.">
      <div>
        <Link
          to="/registroFact"
          className="inline-block rounded-xl bg-[#5BD3C7] px-4 py-2.5 text-sm font-bold text-[#2B2E4A] shadow-sm transition hover:bg-[#4ac3b7]"
        >
          Registrar factura
        </Link>
      </div>
      <Alert type={status.type}>{status.message}</Alert>
      <Table headers={['Vencimiento', 'Nº', 'Beneficiario', 'Importe', 'Estado', 'Acciones']}>
        {invoices.length === 0 && <EmptyRow colSpan={6}>Aún no hay facturas registradas.</EmptyRow>}
        {invoices.map((f) => {
          const overdue = f.status !== 'pagada' && f.status !== 'rechazada' && f.dueDate < hoy;
          return (
            <tr key={f.id}>
              <td className={`px-3 py-2.5 ${overdue ? 'font-semibold text-red-600' : 'text-slate-600'}`}>
                {formatDate(f.dueDate)}
                {overdue && <span className="ml-1 text-xs">(vencida)</span>}
              </td>
              <td className="px-3 py-2.5 text-slate-600">{f.invoiceNumber}</td>
              <td className="px-3 py-2.5 font-medium text-slate-900">
                {f.payee}
                {f.concept && <p className="text-xs font-normal text-slate-500">{f.concept}</p>}
              </td>
              <td className="px-3 py-2.5 text-slate-900">{formatMoney(f.amountCents, f.currency)}</td>
              <td className="px-3 py-2.5">
                <StatusBadge status={f.status} />
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <select
                    aria-label="Cambiar estado"
                    value={f.status}
                    disabled={busy}
                    onChange={(e) => run(() => api.updateInvoice(f.id, { status: e.target.value }), `Factura ${LABELS[e.target.value].toLowerCase()}.`)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <LinkButton danger disabled={busy} onClick={() => handleDelete(f)}>
                    Eliminar
                  </LinkButton>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </Panel>
  );
};
