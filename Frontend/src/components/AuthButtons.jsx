import React from 'react';
import { Link } from 'react-router-dom';

export const AuthButtons = ({ isLoggedIn = false }) => {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
          <span>●</span>
          Cuenta activa
        </span>

        <Link
          to="/perfil"
          title="Mi perfil"
          aria-label="Mi perfil"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B2E4A] text-white transition hover:bg-slate-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-indigo-700"
      >
        Ingresar
      </Link>

      <Link
        to="/register"
        className="rounded-lg bg-[#5BD3C7] px-4 py-2 text-sm font-bold text-[#2B2E4A] shadow-sm transition hover:bg-[#4ac3b7] hover:shadow"
      >
        Registrarse
      </Link>
    </div>
  );
};