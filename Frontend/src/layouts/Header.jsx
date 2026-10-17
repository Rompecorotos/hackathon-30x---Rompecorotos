import React from 'react';
import { Logo } from '../components/Logo';
import { NavLink } from '../components/NavLink';
import { AuthButtons } from '../components/AuthButtons';

export const Header = ({ isLoggedIn = false }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Izquierda: Logo y Menú de Navegación */}
        <div className="flex items-center gap-8">
          <Logo />

          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="#planes">Planes</NavLink>
            <NavLink href="#documentacion">Documentación</NavLink>
            
            {/* Opción adicional visible SOLO cuando está logueado */}
            {isLoggedIn && (
              <NavLink href="#dashboard">Mi Panel</NavLink>
            )}
          </nav>
        </div>

        {/* Derecha: Botones de Auth */}
        <AuthButtons isLoggedIn={isLoggedIn} />

      </div>
    </header>
  );
};