import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormCard } from '../components/FormCard';
import { InputField } from '../components/InputField';
import { FrameImage } from '../components/FrameImage';

export const Login = ({ 
    imageUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    imageAlt="Procesamiento de Inteligencia Artificial y flujos de datos", 
    imageCaption="Infraestructura cognitiva y analítica avanzada para transacciones." 
}) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Iniciando sesión con:', formData);
  };

  const handleForgotPass = (e) => {
    e.preventDefault();
    if (!formData.email) {
      alert('Por favor, ingresa tu correo electrónico primero para enviarte el código OTP.');
      return;
    }
    setOtpSent(true);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[85vh]">
      {/* Contenedor en Grid ampliado a max-w-7xl */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-7xl">
        
        {/* Columna Izquierda: Formulario de Login y Logo (Ocupa 5 columnas en lg) */}
        <div className="flex flex-col items-center justify-center w-full lg:col-span-5">
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

          {/* Tarjeta del Formulario */}
          <div className="w-full max-w-md">
            <FormCard
              title="Bienvenido de nuevo"
              subtitle="Accede a tu panel de control y pagos recurrentes"
              onSubmit={handleSubmit}
              submitText="Ingresar a la Plataforma"
            >
              <InputField
                label="Correo Electrónico"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@empresa.com"
                required
              />

              <div className="space-y-1">
                <InputField
                  label="Contraseña"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                
                {/* Enlace de Recuperación de contraseña vía OTP */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPass}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ¿Olvidaste tu contraseña? (Recuperar con OTP)
                  </button>
                </div>
              </div>

              {/* Notificación de envío de OTP simulado */}
              {otpSent && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center animate-fadeIn">
                  ¡Código OTP de recuperación enviado exitosamente a <strong>{formData.email}</strong>! Revisa tu bandeja.
                </div>
              )}
            </FormCard>

            {/* Opción para ir a Registro si no tiene cuenta */}
            <div className="mt-6 text-center text-sm text-slate-600">
              ¿Aún no tienes una cuenta en Bankly?{' '}
              <Link
                to="/register"
                className="font-bold text-[#2B2E4A] hover:text-[#5BD3C7] transition-colors underline decoration-[#5BD3C7] decoration-2 underline-offset-4"
              >
                Regístrate aquí
              </Link>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Imagen ampliada enmarcada (Ocupa 7 columnas en lg) */}
        <div className="hidden lg:block w-full lg:col-span-7">
          <FrameImage
            src={imageUrl}
            alt={imageAlt}
            caption={imageCaption}
          />
        </div>

      </div>
    </div>
  );
};
