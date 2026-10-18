import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './layouts/Header';
import { Footer } from './layouts/Footer';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatWidget } from './components/ChatWidget';
import { PlanModal } from './components/PlanModal';

function AppShell() {
  const { isLoggedIn, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* El Header se mantiene visible en todas partes */}
      <Header isLoggedIn={isLoggedIn} />

      {/* Aquí se cargan las vistas según la URL */}
      <main className="p-6">
        <AppRoutes isLoggedIn={isLoggedIn} isLoading={isLoading} />
      </main>

      <Footer />

      {/* Asistente IA: solo para usuarios autenticados (protege la cuota gratuita) */}
      {isLoggedIn && <ChatWidget />}
      {isLoggedIn && <PlanModal />}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
