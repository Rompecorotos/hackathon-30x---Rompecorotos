import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './layouts/Header';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* El Header se mantiene visible en todas partes */}
        <Header isLoggedIn={isLoggedIn} />

        {/* Aquí se cargan las vistas según la URL */}
        <main className="p-6">
          <AppRoutes isLoggedIn={isLoggedIn} />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;