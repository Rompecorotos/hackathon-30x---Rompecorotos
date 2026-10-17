import React from 'react';

export const NavLink = ({ href, children }) => {
  return (
    <a
      href={href}
      className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
    >
      {children}
    </a>
  );
};