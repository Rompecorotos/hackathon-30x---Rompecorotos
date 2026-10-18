import React from 'react';
import { Logo } from '../components/Logo';
import { NavLink } from '../components/NavLink';
import { AuthButtons } from '../components/AuthButtons';

export const Header = ({ isLoggedIn = false }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Izquierda: Logo y Menú de Navegación */}
        <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar py-2">
          <Logo />

          {/* Menú visible desde tablets/desktop, oculto en móviles muy pequeños si prefieres */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/plans">Planes</NavLink>
            <NavLink href="/documentation">Documentación</NavLink>
            
            {/* Opción adicional visible SOLO cuando está logueado */}
            {isLoggedIn && (
              <NavLink href="/dashboard">Mi Panel</NavLink>
            )}
          </nav>
        </div>

        {/* Derecha: Botones de Auth */}
        <div className="flex-shrink-0">
          <AuthButtons isLoggedIn={isLoggedIn} />
        </div>

      </div>
    </header>
  );
};