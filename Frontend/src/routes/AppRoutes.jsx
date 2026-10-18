import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ScrollToTop } from '../components/ScrollTop';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { Home } from '../pages/Home';
import { Plans } from '../pages/Plans';
import { Documentation } from '../pages/Documentation';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Profile } from '../pages/Profile';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Dashboard } from '../pages/Dashboard';

export const AppRoutes = ({ isLoggedIn, isLoading }) => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rutas Públicas (Login / Register) */}
        <Route element={<PublicRoute isLoggedIn={isLoggedIn} isLoading={isLoading} />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Rutas Privadas */}
        <Route element={<PrivateRoute isLoggedIn={isLoggedIn} isLoading={isLoading} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>

        <Route path="*" element={<div className="p-8 text-center text-xl font-bold">404 - Página no encontrada</div>} />
      </Routes>
    </>
  );
};
