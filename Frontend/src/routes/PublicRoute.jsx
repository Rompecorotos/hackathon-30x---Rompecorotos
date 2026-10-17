import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { RouteLoader } from './RouteLoader';

export const PublicRoute = ({ isLoggedIn, isLoading = false, redirectTo = '/dashboard' }) => {
  if (isLoading) {
    return <RouteLoader />;
  }
  if (isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};
