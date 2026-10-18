import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormCard } from "../components/FormCard";
import { InputField } from "../components/InputField";
import { PageTransition } from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { passwordError, PASSWORD_HELP } from "../lib/password";

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptPromos: false,
    acceptTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [confirmEmail, setConfirmEmail] = useState(null); // si hay que confirmar el correo

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError("");
  };

  // Mismas reglas que el backend, para avisar antes de enviar.
  // (El backend vuelve a validar: esto es solo comodidad para el usuario.)
  const validate = () => {
    const er = {};
    const fullName =
      `${formData.nombre.trim()} ${formData.apellido.trim()}`.trim();

    if (fullName.length < 2)
      er.nombre = "El nombre debe tener al menos 2 caracteres";
    else if (fullName.length > 120) er.nombre = "El nombre es demasiado largo";

    const pwError = passwordError(formData.password);
    if (pwError) er.password = pwError;

    if (formData.password !== formData.confirmPassword) {
      er.confirmPassword = "Las contraseñas no coinciden. Por favor verifica.";
    }

    if (!formData.acceptTerms) {
      er.acceptTerms =
        "Debes aceptar los Términos y Condiciones para registrarte.";
    }

    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setIsLoading(true);
    const email = formData.email.trim();

    try {
      // El backend pide un único campo "fullName": juntamos nombre y apellido.
      const result = await register({
        fullName:
          `${formData.nombre.trim()} ${formData.apellido.trim()}`.trim(),
        email,
        password: formData.password,
      });

      if (result?.needsConfirmation) {
        // Supabase exige confirmar el correo antes de entrar
        setConfirmEmail(email);
      } else {
        // Ya hay sesión: directo al panel
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const fields = err?.fields;
      if (fields && Object.keys(fields).length > 0) {
        // El backend usa "fullName"; en este formulario ese error va bajo "Nombre"
        setErrors({
          nombre: fields.fullName,
          email: fields.email,
          password: fields.password,
        });
      } else {
        setFormError(
          err?.message || "No se pudo crear la cuenta. Inténtalo de nuevo.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Pantalla "revisa tu correo" ----
  if (confirmEmail) {
    return (
      <PageTransition>
        <div className="w-full max-w-2xl mx-auto px-4 py-12 flex flex-col items-center">
          <FormCard
            title="Revisa tu correo"
            subtitle={`Te enviamos un enlace de confirmación a ${confirmEmail}. Ábrelo para activar tu cuenta.`}
            onSubmit={(e) => e.preventDefault()}
          >
            <p className="text-center text-sm text-slate-600">
              Cuando confirmes tu correo podrás{" "}
              <Link
                to="/login"
                className="font-bold text-[#2B2E4A] hover:text-[#5BD3C7] transition-colors underline decoration-[#5BD3C7] decoration-2 underline-offset-4"
              >
                iniciar sesión
              </Link>
              .
            </p>
          </FormCard>
        </div>
      </PageTransition>
    );
  }

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
              <path
                d="M 52,56 L 86,16"
                stroke="#5BD3C7"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <path
                d="M 64,16 H 86 V 38"
                stroke="#5BD3C7"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
                error={errors.nombre}
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
              error={errors.email}
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
                error={errors.password}
                helpText={PASSWORD_HELP}
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
                error={errors.confirmPassword}
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
                  Deseo recibir correos electrónicos sobre actualizaciones y
                  novedades de Bankly.
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
                  Acepto los{" "}
                  <span className="font-semibold text-[#2B2E4A] underline cursor-pointer">
                    Términos y Condiciones
                  </span>{" "}
                  y la{" "}
                  <span className="font-semibold text-[#2B2E4A] underline cursor-pointer">
                    Política de Privacidad
                  </span>
                  . <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs font-medium text-red-500">
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* Error general (correo ya registrado, backend apagado, etc.) */}
            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {formError}
              </p>
            )}
          </FormCard>

          {/* Opción para ir a Login */}
          <div className="mt-4 mb-4 text-center text-sm text-slate-600">
            ¿Ya tienes una cuenta en Bankly?{" "}
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
