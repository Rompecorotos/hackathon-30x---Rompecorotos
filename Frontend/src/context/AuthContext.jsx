import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((data) => {
    setUser(data?.user ?? null);
    setProfile(data?.profile ?? null);
  }, []);

  useEffect(() => {
    api
      .getSession()
      .then(applySession)
      .catch(() => applySession(null))
      .finally(() => setIsLoading(false));
  }, [applySession]);

  const login = useCallback(async (credentials) => applySession(await api.login(credentials)), [applySession]);

  const register = useCallback(
    async (data) => {
      const result = await api.register(data);
      if (!result.needsConfirmation) applySession(result);
      return result;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await api.logout();
    // El aviso del plan vuelve a mostrarse en el siguiente inicio de sesión.
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith('bankly.planNotice.'))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* sin almacenamiento disponible */
    }
    applySession(null);
  }, [applySession]);

  const updateProfile = useCallback(async (data) => {
    const { profile: updated } = await api.updateProfile(data);
    setProfile(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ user, profile, isLoading, isLoggedIn: !!user, login, register, logout, updateProfile }),
    [user, profile, isLoading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
};
