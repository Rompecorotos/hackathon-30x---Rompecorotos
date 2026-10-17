import React from 'react';

export const Logo = () => {
  return (
    <a href="/" className="flex items-center gap-2.5 group">
      {/* Isotipo: Letra B estilizada con gráfica y flecha ascendente */}
      <svg
        width="38"
        height="38"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200 group-hover:scale-105"
      >
        {/* Cuerpo principal de la B en color azul/marino oscuro */}
        <path
          d="M20 12 H62 C78 12 88 22 88 36 C88 48 80 56 68 59 C82 62 90 72 90 86 C90 100 78 110 60 110 H20 V12 Z"
          fill="none"
        />
        {/* Trazo grueso de la B */}
        <path
          d="M 22,12 H 60 C 74,12 84,21 84,34 C 84,46 76,53 64,56 L 50,56 C 45,56 42,59 42,64 L 42,88 C 42,94 46,98 52,98 H 60 C 75,98 84,89 84,75"
          stroke="#2B2E4A"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Línea interior diagonal de gráfico / circuito */}
        <path
          d="M 22,60 L 38,42 L 52,56 L 68,36"
          stroke="#2B2E4A"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Círculo del nodo en la línea interior */}
        <circle cx="52" cy="28" r="6" fill="#2B2E4A" />

        {/* Flecha turquesa ascendente */}
        <path
          d="M 52,56 L 86,16"
          stroke="#4AD3B7"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 64,16 H 86 V 38"
          stroke="#4AD3B7"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Tipografía: Bankly e INTELIGENCIA DE PAGOS */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline text-2xl font-black tracking-tight text-[#2B2E4A]">
          <span>Bankl</span>
          <span className="text-[#4AD3B7]">y</span>
        </div>
        <span className="text-[9px] font-bold tracking-widest text-[#2B2E4A] uppercase mt-0.5">
          Inteligencia de Pagos
        </span>
      </div>
    </a>
  );
};