import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FormCard } from '../components/FormCard';
import { InputField } from '../components/InputField';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(
    searchParams.get('error') === 'confirmacion' ? 'El enlace de confirmación no es válido o ha expirado.' : '',
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!EMAIL_RE.test(form.email.trim())) nextErrors.email = 'Email inválido';
    if (!form.password) nextErrors.password = 'La contraseña es obligatoria';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(err.fields ?? {});
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-16">
      <FormCard
        title="Ingresar"
        subtitle="Accede a tu panel de cobros"
        onSubmit={handleSubmit}
        submitText="Ingresar"
        isLoading={isLoading}
      >
        {formError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {formError}
          </p>
        )}
        <InputField label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@empresa.com" error={errors.email} required disabled={isLoading} />
        <InputField label="Contraseña" type="password" name="password" value={form.password} onChange={handleChange} error={errors.password} required disabled={isLoading} />
      </FormCard>
      <p className="mt-6 text-center text-sm text-slate-600">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-[#2B2E4A] hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
};
