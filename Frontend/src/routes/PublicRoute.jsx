import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const PublicRoute = ({ isLoggedIn, redirectTo = '/dashboard' }) => {
  if (isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};