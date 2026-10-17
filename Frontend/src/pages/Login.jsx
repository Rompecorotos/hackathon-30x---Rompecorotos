import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormCard } from "../components/FormCard";
import { InputField } from "../components/InputField";
import  useAuth  from "../context/Authcontext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { signIn, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si venía de una página privada, vuelve ahí; si no, va al registro de facturas.
  const destino = location.state?.from?.pathname || "/registroFact";

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setFormError("");
  }

  function validate() {
    const er = {};
    if (!EMAIL_RE.test(values.email.trim()))
      er.email = "Escribe un correo válido";
    if (values.password.length < 6) er.password = "Mínimo 6 caracteres";
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setIsLoading(true);
    const { error } = await signIn(values.email.trim(), values.password);
    setIsLoading(false);

    if (error) {
      setFormError("Correo o contraseña incorrectos.");
      return;
    }
    navigate(destino, { replace: true });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md">
        <FormCard
          title="Iniciar sesión"
          subtitle="Ingresa para registrar y revisar tus facturas"
          onSubmit={handleSubmit}
          submitText="Ingresar"
          isLoading={isLoading}
        >
          <InputField
            label="Correo electrónico"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            placeholder="tu@empresa.com"
            error={errors.email}
            required
          />
          <InputField
            label="Contraseña"
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.password}
            required
          />

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {formError}
            </p>
          )}
        </FormCard>

        {isDemo && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Modo demo: aún no hay Supabase conectado. Cualquier correo y una
            contraseña de 6 o más caracteres te dejan entrar.
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
