import React from 'react';

export const AuthButtons = ({ isLoggedIn }) => {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          ● Cuenta Activa
        </span>
        <button
          className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm"
          title="Mi Perfil"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href="/login"
        className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
      >
        Ingresar
      </a>
      <a
        href="/register"
        className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition-all"
      >
        Registrarse
      </a>
    </div>
  );
};