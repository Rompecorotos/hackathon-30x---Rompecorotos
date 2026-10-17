import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { Home } from '../pages/Home';
import { Plans } from '../pages/Plans';
import { Documentation } from '../pages/Documentation';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
<<<<<<< HEAD
=======
import { Profile } from '../pages/Profile';
>>>>>>> 5863f7a1996d749683e1cdd2591b035bfe6eb631

export const AppRoutes = ({ isLoggedIn, isLoading }) => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/documentation" element={<Documentation/>} />

      {/* Rutas Públicas (Login / Register) */}
<<<<<<< HEAD
      <Route element={<PublicRoute isLoggedIn={isLoggedIn} />}>
=======
      <Route element={<PublicRoute isLoggedIn={isLoggedIn} isLoading={isLoading} />}>
>>>>>>> 5863f7a1996d749683e1cdd2591b035bfe6eb631
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Rutas Privadas */}
      <Route element={<PrivateRoute isLoggedIn={isLoggedIn} isLoading={isLoading} />}>
        <Route path="/dashboard" element={<div className="p-8 text-center text-xl font-bold">Mi Panel Privado / Dashboard</div>} />
        <Route path="/perfil" element={<Profile />} />
      </Route>

      <Route path="*" element={<div className="p-8 text-center text-xl font-bold">404 - Página no encontrada</div>} />
    </Routes>
  );
};
