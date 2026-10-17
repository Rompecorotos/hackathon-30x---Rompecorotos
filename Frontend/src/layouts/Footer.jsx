import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-[#2B2E4A] text-slate-300 w-full mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Contenido principal del Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pb-12 border-b border-slate-700/60">
          
          {/* Columna 1: Marca / Isotipo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl w-fit">
              <div className="flex items-center gap-2.5">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 22,12 H 60 C 74,12 84,21 84,34 C 84,46 76,53 64,56 L 50,56 C 45,56 42,59 42,64 L 42,88 C 42,94 46,98 52,98 H 60 C 75,98 84,89 84,75"
                    stroke="#ffffff"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 22,60 L 38,42 L 52,56 L 68,36"
                    stroke="#ffffff"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="52" cy="28" r="6" fill="#ffffff" />
                  <path d="M 52,56 L 86,16" stroke="#5BD3C7" strokeWidth="11" strokeLinecap="round" />
                  <path d="M 64,16 H 86 V 38" stroke="#5BD3C7" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex flex-col justify-center leading-none">
                  <div className="flex items-baseline text-xl font-black tracking-tight text-white">
                    <span>Bankl</span>
                    <span className="text-[#5BD3C7]">y</span>
                  </div>
                  <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                    Inteligencia de Pagos
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Infraestructura bancaria de suscripciones y débito automático inteligente para escalar ingresos recurrentes con máxima seguridad.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-[#5BD3C7] transition-colors">
                  Inicio / Landing Page
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-slate-400 hover:text-[#5BD3C7] transition-colors">
                  Planes y Tarifas
                </Link>
              </li>
              <li>
                <Link to="/documentation" className="text-slate-400 hover:text-[#5BD3C7] transition-colors">
                  Documentación Técnica
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-[#5BD3C7] transition-colors">
                  Acceso a Clientes
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto y Correos (Corregido para pantallas pequeñas) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase">
              Contacto y Soporte
            </h4>
            <div className="space-y-4 text-sm text-slate-400">
              {/* Teléfono */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-[#5BD3C7] font-bold">Teléfono:</span>
                <span>+58 (424) 599-5961</span>
              </div>

              {/* Correos apilados en columna */}
              <div className="flex flex-col space-y-1">
                <span className="text-[#5BD3C7] font-bold">Correo Electrónico:</span>
                <a
                  href="mailto:soporte@bankly.com"
                  className="hover:text-white transition-colors break-all"
                >
                  soporte@bankly.com
                </a>
                <a
                  href="mailto:equipo@rompecorotos.com"
                  className="hover:text-white transition-colors break-all"
                >
                  equipo@rompecorotos.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Barra inferior: Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-left">
          <p>© 2026 Equipo Rompecorotos. Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Política de Privacidad</span>
            <span className="hover:text-white cursor-pointer transition-colors">Términos de Servicio</span>
            <span className="hover:text-white cursor-pointer transition-colors">Seguridad PCI-DSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};