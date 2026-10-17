import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { RouteLoader } from './RouteLoader';

export const PrivateRoute = ({ isLoggedIn, isLoading = false, redirectTo = '/login' }) => {
  // Esperar a conocer la sesión evita redirigir a /login al recargar estando autenticado.
  if (isLoading) {
    return <RouteLoader />;
  }
  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};
