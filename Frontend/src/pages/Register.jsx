import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormCard } from '../components/FormCard';
import { InputField } from '../components/InputField';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismas reglas que el backend (src/lib/validation.ts) para dar feedback inmediato.
function validate(form) {
  const errors = {};
  const name = form.fullName.trim();
  if (name.length < 2) errors.fullName = 'El nombre debe tener al menos 2 caracteres';
  else if (name.length > 120) errors.fullName = 'El nombre no puede superar 120 caracteres';
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Email inválido';
  if (form.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
  else if (form.password.length > 72) errors.password = 'La contraseña no puede superar 72 caracteres';
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = 'La contraseña debe incluir letras y números';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Las contraseñas no coinciden';
  return errors;
}

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    try {
      const email = form.email.trim();
      const result = await register({ fullName: form.fullName.trim(), email, password: form.password });
      if (result.needsConfirmation) setPendingEmail(email);
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(err.fields ?? {});
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="py-8 sm:py-16">
        <FormCard title="Revisa tu email" subtitle="Te enviamos un enlace para activar tu cuenta">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            Si <strong>{pendingEmail}</strong> no estaba registrado, recibirás un correo de confirmación en unos minutos.
          </p>
          <Link to="/login" className="block text-center text-sm font-semibold text-[#2B2E4A] hover:underline">
            Volver a Ingresar
          </Link>
        </FormCard>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-16">
      <FormCard
        title="Crear cuenta"
        subtitle="Empieza a automatizar tus cobros"
        onSubmit={handleSubmit}
        submitText="Registrarse"
        isLoading={isLoading}
      >
        {formError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {formError}
          </p>
        )}
        <InputField label="Nombre completo" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} required disabled={isLoading} />
        <InputField label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@empresa.com" error={errors.email} required disabled={isLoading} />
        <InputField label="Contraseña" type="password" name="password" value={form.password} onChange={handleChange} error={errors.password} helpText="Mínimo 8 caracteres, con letras y números" required disabled={isLoading} />
        <InputField label="Confirmar contraseña" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required disabled={isLoading} />
      </FormCard>
      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-[#2B2E4A] hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  );
};
