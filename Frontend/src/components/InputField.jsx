import React, { useState } from 'react';

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {!open && <path d="M3 3l18 18" />}
  </svg>
);

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
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Las contraseñas distinguen mayúsculas: avisar si Bloq Mayús está activado.
  const checkCapsLock = (e) => setCapsLock(Boolean(e.getModifierState?.('CapsLock')));

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
          type={isPassword && showPassword ? 'text' : type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          {...(isPassword && {
            onKeyDown: checkCapsLock,
            onKeyUp: checkCapsLock,
            onBlur: () => setCapsLock(false),
            autoCapitalize: 'none',
            autoCorrect: 'off',
            spellCheck: false,
          })}
          className={`w-full rounded-xl border bg-white py-2.5 text-slate-900 text-sm placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
            icon ? 'pl-10' : 'pl-4'
          } ${isPassword ? 'pr-11' : 'pr-4'} ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 focus:border-[#5BD3C7] focus:ring-[#5BD3C7]/20 hover:border-slate-300'
          } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}`}
        />

        {/* Ojo para mostrar / ocultar la contraseña */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-[#2B2E4A] disabled:cursor-not-allowed"
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>

      {isPassword && capsLock && (
        <p role="status" className="mt-1 text-xs font-medium text-amber-600">
          Bloq Mayús está activado: la contraseña distingue mayúsculas y minúsculas.
        </p>
      )}

      {/* Mensaje de error o ayuda */}
      {error ? (
        <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-slate-500 mt-1">{helpText}</p>
      ) : null}
    </div>
  );
};
