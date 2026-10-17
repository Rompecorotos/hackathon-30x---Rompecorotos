import React from 'react';
import { LABELS, STATUS_STYLES } from '../../lib/format';

export const Panel = ({ title, subtitle, children }) => (
  <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div>
      <h2 className="text-lg font-bold text-[#2B2E4A]">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </section>
);

export const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? ''}`}>
    {LABELS[status] ?? status}
  </span>
);

export const Alert = ({ type = 'error', children }) =>
  children ? (
    <p
      role={type === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${
        type === 'error' ? 'border-red-200 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {children}
    </p>
  ) : null;

export const PrimaryButton = ({ children, isLoading, ...props }) => (
  <button
    type="submit"
    disabled={isLoading}
    className="rounded-xl bg-[#5BD3C7] px-4 py-2.5 text-sm font-bold text-[#2B2E4A] shadow-sm transition hover:bg-[#4ac3b7] disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  >
    {isLoading ? 'Guardando...' : children}
  </button>
);

export const LinkButton = ({ children, danger = false, ...props }) => (
  <button
    type="button"
    className={`text-xs font-semibold transition disabled:opacity-50 ${
      danger ? 'text-red-500 hover:text-red-700' : 'text-[#2B2E4A] hover:text-indigo-700'
    }`}
    {...props}
  >
    {children}
  </button>
);

export const EmptyRow = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="px-3 py-6 text-center text-sm text-slate-500">
      {children}
    </td>
  </tr>
);

export const Table = ({ headers, children }) => (
  <div className="-mx-5 overflow-x-auto sm:mx-0">
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
          {headers.map((h) => (
            <th key={h} className="px-3 py-2 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  </div>
);
