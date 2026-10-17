import React from 'react';

// Variante de InputField para <select>, con el mismo estilo.
export const SelectField = ({ label, name, value, onChange, options, error, required = false, disabled = false }) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-[#2B2E4A]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-200 focus:border-[#5BD3C7] focus:ring-[#5BD3C7]/20 hover:border-slate-300'
        } ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-75' : ''}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};
