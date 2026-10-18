import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Menú del icono de usuario: Mi perfil y Cerrar sesión.
const UserMenu = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setOpen(false);
      navigate('/', { replace: true });
    } catch {
      setLoggingOut(false);
    }
  };

  const itemClass =
    'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Mi cuenta"
        aria-label="Mi cuenta"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B2E4A] text-white transition hover:bg-slate-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-[#2B2E4A]">{profile?.fullName ?? 'Mi cuenta'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <Link to="/perfil" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            Mi perfil
          </Link>
          <button type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut} className={`${itemClass} text-red-600 hover:bg-red-50`}>
            {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  );
};

export const AuthButtons = ({ isLoggedIn = false }) => {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
          <span>●</span>
          Cuenta activa
        </span>

        <UserMenu />
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