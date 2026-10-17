import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../components/FormCard';
import { InputField } from '../components/InputField';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, profile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = fullName.trim();
    setStatus({ type: '', message: '' });
    if (name.length < 2 || name.length > 120) {
      setError('El nombre debe tener entre 2 y 120 caracteres');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const updated = await updateProfile({ fullName: name });
      setFullName(updated.fullName);
      setStatus({ type: 'success', message: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setError(err.fields?.fullName ?? '');
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6 py-8 sm:py-16">
      <FormCard
        title="Mi perfil"
        subtitle="Gestiona los datos de tu cuenta"
        onSubmit={handleSubmit}
        submitText="Guardar cambios"
        isLoading={isSaving}
      >
        {status.message && (
          <p
            role={status.type === 'error' ? 'alert' : 'status'}
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {status.message}
          </p>
        )}
        <InputField label="Email" type="email" name="email" value={user?.email ?? ''} disabled />
        <InputField
          label="Nombre completo"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={error}
          required
          disabled={isSaving}
        />
      </FormCard>

      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
};
