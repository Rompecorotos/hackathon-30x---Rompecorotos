import React from 'react';

export const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  icon,
  helpText,
  disabled = false,
}) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {/* Etiqueta / Label */}
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-[#2B2E4A]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Contenedor del Input */}
      <div className="relative rounded-xl shadow-sm">
        {/* Ícono opcional a la izquierda */}
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white py-2.5 text-slate-900 text-sm placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 focus:border-[#5BD3C7] focus:ring-[#5BD3C7]/20 hover:border-slate-300'
          } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}`}
        />
      </div>

      {/* Mensaje de error o ayuda */}
      {error ? (
        <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-slate-500 mt-1">{helpText}</p>
      ) : null}
    </div>
  );
};