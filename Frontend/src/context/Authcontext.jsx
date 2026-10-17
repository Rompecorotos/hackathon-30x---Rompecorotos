// src/context/AuthContext.jsx
// Guarda quién está logueado y lo comparte con toda la app.
//
// - Con Supabase configurado (.env con las dos claves): usa supabase.auth de verdad.
// - Sin Supabase: MODO DEMO. Cualquier correo y contraseña (mín. 6 caracteres) entra.
//   Es solo para poder desarrollar el frontend; no protege nada de verdad.

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";

const AuthContext = createContext(null);
const DEMO_KEY = "bankly_demo_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- Modo demo: recuperar el usuario guardado en el navegador ---
    if (!supabaseReady) {
      try {
        const saved = localStorage.getItem(DEMO_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch {
        /* si falla, simplemente no hay sesión */
      }
      setLoading(false);
      return;
    }

    // --- Modo real: sesión de Supabase ---
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    if (!supabaseReady) {
      const demoUser = { id: "demo-user", email };
      try {
        localStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
      } catch {
        /* ignorar */
      }
      setUser(demoUser);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  async function signOut() {
    if (!supabaseReady) {
      try {
        localStorage.removeItem(DEMO_KEY);
      } catch {
        /* ignorar */
      }
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, isDemo: !supabaseReady }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
