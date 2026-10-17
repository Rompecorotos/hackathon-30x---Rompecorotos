import React from 'react';
import { Link } from 'react-router-dom';

export const PlanCard = ({
  title,
  description,
  price,
  period = '/ mes',
  features = [],
  buttonText = 'Seleccionar Plan',
  buttonLink = '/register',
  isPopular = false,
  badgeText = 'Más Popular',
  customFooterText,
}) => {
  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 sm:p-8 transition-all duration-300 hover:shadow-lg ${
        isPopular
          ? 'border-2 border-[#5BD3C7] shadow-md scale-100 lg:-translate-y-2'
          : 'border border-slate-200 shadow-sm hover:border-slate-300'
      }`}
    >
      {/* Insignia para Plan Destacado / Popular */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-[#5BD3C7] px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-[#2B2E4A] shadow-sm">
            {badgeText}
          </span>
        </div>
      )}

      <div>
        {/* Encabezado del Plan */}
        <div className="text-left space-y-2">
          <h3 className="text-xl font-extrabold text-[#2B2E4A]">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 min-h-[40px]">
            {description}
          </p>
        </div>

        {/* Precio */}
        <div className="my-6 text-left flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-black text-[#2B2E4A]">
            {price}
          </span>
          {period && (
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              {period}
            </span>
          )}
        </div>

        {/* Separador */}
        <div className="h-px w-full bg-slate-100 my-6"></div>

        {/* Lista de Características / Beneficios */}
        <ul className="space-y-3.5 text-left mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
              <svg
                className="h-5 w-5 flex-shrink-0 text-[#5BD3C7]"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Botón de Acción y Texto de Pie */}
      <div className="space-y-3 pt-2">
        <Link
          to={buttonLink}
          className={`w-full block text-center py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm ${
            isPopular
              ? 'bg-[#5BD3C7] text-[#2B2E4A] hover:bg-[#4ac3b7]'
              : 'bg-[#2B2E4A] text-white hover:bg-slate-800'
          }`}
        >
          {buttonText}
        </Link>

        {customFooterText && (
          <p className="text-[11px] text-center text-slate-400 font-medium">
            {customFooterText}
          </p>
        )}
      </div>
    </div>
  );
};