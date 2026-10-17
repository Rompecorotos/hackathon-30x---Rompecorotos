import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const PrivateRoute = ({ isLoggedIn, redirectTo = '/login' }) => {
  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};