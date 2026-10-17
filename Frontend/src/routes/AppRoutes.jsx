import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { Home } from '../pages/Home'; 
import InvoiceForm from '../pages/InvoiceForm';
import { Login } from '../pages/Login';

export const AppRoutes = ({ isLoggedIn }) => {
  return (
    <Routes>
      {/* Ruta Principal / Landing Page */}
      <Route path="/" element={<Home />} />
      <Route
        path="/planes"
        element={
          <div className="p-8 text-center text-xl font-bold">
            Vista de Planes
          </div>
        }
      />
      <Route
        path="/documentacion"
        element={
          <div className="p-8 text-center text-xl font-bold">
            Vista de Documentación
          </div>
        }
      />

      {/* Rutas Públicas (Login / Register) */}
      <Route
        element={
          <PublicRoute isLoggedIn={isLoggedIn} redirectTo="/registroFact" />
        }
      >
        <Route path="/login" element={<Login />} />
        <Route
          path="/register"
          element={
            <div className="p-8 text-center text-xl font-bold">
              Vista de Registro
            </div>
          }
        />
      </Route>

      {/* Rutas Privadas */}
      <Route element={<PrivateRoute isLoggedIn={isLoggedIn} />}>
        <Route path="/registroFact" element={<InvoiceForm />} />
        <Route
          path="/dashboard"
          element={
            <div className="p-8 text-center text-xl font-bold">
              Mi Panel Privado / Dashboard
            </div>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <div className="p-8 text-center text-xl font-bold">
            404 - Página no encontrada
          </div>
        }
      />
    </Routes>
  );
};