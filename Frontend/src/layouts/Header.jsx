
import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { NavLink } from '../components/NavLink';
import { AuthButtons } from '../components/AuthButtons';

export const Header = ({ isLoggedIn = false }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Logo />

        {/* Navegación principal */}
        <nav className="hidden items-center gap-7 md:flex">
          <NavLink href="/planes">Planes</NavLink>
          <NavLink href="/documentacion">Documentación</NavLink>
          <NavLink href="/seguridad">Seguridad</NavLink>

          {isLoggedIn && (
            <NavLink href="/dashboard">Mi Panel</NavLink>
          )}
        </nav>

        {/* Acciones del usuario */}
        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 sm:block">
            <span className="text-xs font-semibold text-slate-600">
              <span className="mr-1 text-emerald-500">●</span>
              SEPA & Débito Directo
            </span>
          </div>

          <AuthButtons isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </header>
  );
};
