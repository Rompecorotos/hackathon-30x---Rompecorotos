import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { Home } from '../pages/Home'; 
import { Plans } from '../pages/Plans';
import { Documentation } from '../pages/Documentation';

export const AppRoutes = ({ isLoggedIn }) => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/documentation" element={<Documentation/>} />

      {/* Rutas Públicas (Login / Register) */}
      <Route element={<PublicRoute isLoggedIn={isLoggedIn} />}>
        <Route path="/login" element={<div className="p-8 text-center text-xl font-bold">Vista de Login</div>} />
        <Route path="/register" element={<div className="p-8 text-center text-xl font-bold">Vista de Registro</div>} />
      </Route>

      {/* Rutas Privadas */}
      <Route element={<PrivateRoute isLoggedIn={isLoggedIn} />}>
        <Route path="/dashboard" element={<div className="p-8 text-center text-xl font-bold">Mi Panel Privado / Dashboard</div>} />
      </Route>

      <Route path="*" element={<div className="p-8 text-center text-xl font-bold">404 - Página no encontrada</div>} />
    </Routes>
  );
};