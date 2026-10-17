import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormCard } from '../components/FormCard';
import { InputField } from '../components/InputField';
import { PageTransition } from '../components/PageTransition';


export const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptPromos: false,
    acceptTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    if (!formData.acceptTerms) {
      alert('Debes aceptar los Términos y Condiciones para registrarte.');
      return;
    }

    setIsLoading(true);
    console.log('Datos de Registro:', formData);

    setTimeout(() => {
      setIsLoading(false);
      alert('¡Registro exitoso! Ya puedes iniciar sesión.');
    }, 1200);
  };

  return (
    <PageTransition>
      <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-start">
      
      {/* Logo animado superior más compacto */}
      <div className="mb-4 flex flex-col items-center group cursor-pointer">
        <div className="transition-transform duration-500 hover:scale-105 hover:rotate-1">
          <svg
            width="42"
            height="42"
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
        <div className="flex items-baseline text-xl font-black tracking-tight text-[#2B2E4A] mt-1">
          <span>Bankl</span>
          <span className="text-[#5BD3C7]">y</span>
        </div>
        <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
          Inteligencia de Pagos
        </span>
      </div>

      {/* Tarjeta del Formulario de Registro en 2 Columnas */}
      <div className="w-full pb-8 flex flex-col items-center">
        <FormCard
          title="Crea tu cuenta"
          subtitle="Comienza a automatizar tus cobros en minutos"
          onSubmit={handleSubmit}
          submitText="Crear Cuenta en Bankly"
          isLoading={isLoading}
          maxWidth="max-w-xl"
        >
          {/* Grid de dos columnas para distribuir los campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan"
              required
            />
            <InputField
              label="Apellido"
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              placeholder="Pérez"
              required
            />
          </div>

          <InputField
            label="Correo Electrónico"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="juan.perez@empresa.com"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <InputField
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              error={errorMessage}
            />
          </div>

          {/* Checkboxes: Promociones y Términos */}
          <div className="space-y-2 pt-1 text-left">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                name="acceptPromos"
                checked={formData.acceptPromos}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#5BD3C7] focus:ring-[#5BD3C7]"
              />
              <span>
                Deseo recibir correos electrónicos sobre actualizaciones y novedades de Bankly.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#5BD3C7] focus:ring-[#5BD3C7]"
              />
              <span>
                Acepto los{' '}
                <span className="font-semibold text-[#2B2E4A] underline cursor-pointer">
                  Términos y Condiciones
                </span>{' '}
                y la{' '}
                <span className="font-semibold text-[#2B2E4A] underline cursor-pointer">
                  Política de Privacidad
                </span>. <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
        </FormCard>

        {/* Opción para ir a Login */}
        <div className="mt-4 mb-4 text-center text-sm text-slate-600">
          ¿Ya tienes una cuenta en Bankly?{' '}
          <Link
            to="/login"
            className="font-bold text-[#2B2E4A] hover:text-[#5BD3C7] transition-colors underline decoration-[#5BD3C7] decoration-2 underline-offset-4"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </div>

    </div>
    </PageTransition>
  );
};