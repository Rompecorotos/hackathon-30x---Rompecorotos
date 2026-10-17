
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const NavLink = ({ href, children }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={`relative py-2 text-sm font-medium transition-colors
        ${
          isActive
            ? 'text-indigo-700'
            : 'text-slate-600 hover:text-indigo-700'
        }`}
    >
      {children}

      {isActive && (
        <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-indigo-600" />
      )}
    </Link>
  );
};
