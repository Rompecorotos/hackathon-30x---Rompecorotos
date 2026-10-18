import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FormCard } from '../components/FormCard';
import { InputField } from '../components/InputField';
import { PageTransition } from '../components/PageTransition';
import { api } from '../lib/api';
import { passwordError, PASSWORD_HELP } from '../lib/password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FormAlert = ({ message }) =>
  message ? (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </p>
  ) : null;

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1); // Paso 1: Ingresar correo | Paso 2: Ingresar código OTP
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Manejador del temporizador de 1 minuto (60 segundos)
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: 'Por favor, introduce un correo electrónico válido' });
      return;
    }
    await sendCode();
  };

  // Pide al backend que Supabase envíe el código OTP al correo.
  const sendCode = async () => {
    setErrors({});
    setFormError('');
    setIsLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setStep(2); // Pasamos al siguiente estado/input del código
      setCountdown(60); // Activamos el bloqueo de 1 minuto (60 segundos)
    } catch (err) {
      setErrors(err.fields ?? {});
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setErrors({ otpCode: 'Ingresa el código de verificación' });
      return;
    }
    setErrors({});
    setFormError('');
    setIsLoading(true);
    try {
      await api.verifyPasswordCode(email.trim(), otpCode.trim());
      setStep(3);
    } catch (err) {
      setErrors({ otpCode: err.fields?.otpCode ?? err.fields?.token });
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    const pwError = passwordError(newPassword);
    if (pwError) nextErrors.newPassword = pwError;
    if (confirmPassword !== newPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    try {
      await api.resetPassword(newPassword);
      // La verificación del código dejó una sesión iniciada: entramos directamente.
      window.location.assign('/dashboard');
    } catch (err) {
      setErrors({ newPassword: err.fields?.password });
      setFormError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[85vh]">
        
        {/* Logotipo con animación superior */}
        <div className="mb-6 flex flex-col items-center group cursor-pointer">
          <div className="transition-transform duration-500 hover:scale-105 hover:rotate-1">
            <svg
              width="56"
              height="56"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md animate-bounce duration-1000"
            >
              <path
                d="M 22,12 H 60 C 74,12 84,21 84,34 C 84,46 76,53 64,56 L 50,56 C 45,56 42,59 42,64 L 42,88 C 42,94 46,98 52,98 H 60 C 75,98 84,89 84,75"
                stroke="#2B2E4A"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 22,60 L 38,42 L 52,56 L 68,36"
                stroke="#2B2E4A"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="52" cy="28" r="6" fill="#2B2E4A" />
              <path d="M 52,56 L 86,16" stroke="#5BD3C7" strokeWidth="11" strokeLinecap="round" />
              <path d="M 64,16 H 86 V 38" stroke="#5BD3C7" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-baseline text-2xl font-black tracking-tight text-[#2B2E4A] mt-2">
            <span>Bankl</span>
            <span className="text-[#5BD3C7]">y</span>
          </div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Inteligencia de Pagos
          </span>
        </div>

        {/* Tarjeta del Formulario Dinámica Centrada */}
        <div className="w-full max-w-md">
          {step === 1 ? (
            <FormCard
              title="Recuperar Contraseña"
              subtitle="Ingresa tu correo para recibir un código de verificación"
              onSubmit={handleSubmitEmail}
              submitText={countdown > 0 ? `Reenviar en ${countdown}s` : "Enviar Código"}
              isLoading={isLoading}
            >
              <FormAlert message={formError} />
              <InputField
                label="Correo Electrónico"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                error={errors.email}
                required
                disabled={isLoading || countdown > 0}
              />

              {countdown > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center">
                  Hemos enviado un código a tu correo. Podrás solicitar uno nuevo en <strong>{countdown}s</strong>.
                </div>
              )}
            </FormCard>
          ) : step === 3 ? (
            <FormCard
              title="Nueva contraseña"
              subtitle="Elige una contraseña nueva para tu cuenta"
              onSubmit={handleSubmitPassword}
              submitText="Guardar contraseña"
              isLoading={isLoading}
            >
              <FormAlert message={formError} />
              <InputField
                label="Nueva contraseña"
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
                helpText={PASSWORD_HELP}
                required
                disabled={isLoading}
              />
              <InputField
                label="Confirmar contraseña"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                required
                disabled={isLoading}
              />
            </FormCard>
          ) : (
            <FormCard
              title="Verifica tu identidad"
              subtitle={`Introduce el código enviado a ${email}`}
              onSubmit={handleSubmitOtp}
              submitText="Verificar Código"
              isLoading={isLoading}
            >
              <FormAlert message={formError} />
              {/* Input de Correo bloqueado */}
              <InputField
                label="Correo Electrónico"
                type="email"
                value={email}
                disabled={true}
              />

              {/* Input habilitado para el código */}
              <InputField
                label="Código de Verificación (OTP)"
                type="text"
                name="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                error={errors.otpCode}
                required
                disabled={isLoading}
              />

              <div className="flex justify-between items-center pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:underline"
                >
                  ← Cambiar correo
                </button>
                <button
                  type="button"
                  disabled={countdown > 0 || isLoading}
                  onClick={sendCode}
                  className={`font-semibold ${countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                >
                  {countdown > 0 ? `Reenviar código (${countdown}s)` : 'Reenviar código'}
                </button>
              </div>
            </FormCard>
          )}

          {/* Enlace para volver al Login */}
          <div className="mt-6 text-center text-sm text-slate-600">
            ¿Recordaste tu contraseña?{' '}
            <Link
              to="/login"
              className="font-bold text-[#2B2E4A] hover:text-[#5BD3C7] transition-colors underline decoration-[#5BD3C7] decoration-2 underline-offset-4"
            >
              Inicia sesión
            </Link>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};