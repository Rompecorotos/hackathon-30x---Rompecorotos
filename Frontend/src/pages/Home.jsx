import React from 'react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      {/* Sección Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        
        {/* Etiqueta de versión responsiva */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 text-center mx-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <span className="truncate">Plataforma de Cobro Recurrente Certificada v4.8</span>
        </div>

        {/* Título principal adaptativo */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Automatiza tus cobros con Débito Automático inteligente
        </h1>

        {/* Descripción */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Infraestructura bancaria de suscripciones diseñada para eliminar el cobro manual, reducir la fricción de pago y garantizar ingresos predecibles en escala enterprise.
        </p>

        {/* Botones de acción rápida en columna para móviles y fila para tablets/desktop */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-4 w-full">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#5BD3C7] text-[#2B2E4A] font-bold hover:bg-[#4ac3b7] shadow-sm transition-all text-center"
          >
            Comenzar Ahora
          </Link>
          <Link
            to="/planes"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition-all text-center"
          >
            Ver Planes y Precios
          </Link>
        </div>
      </div>

      {/* Sección de Métricas / Confianza (Grid responsivo de 1, 2 o 4 columnas según pantalla) */}
      <div className="mt-16 sm:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div className="text-center p-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900">99.98%</p>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Efectividad de Débito</p>
        </div>
        <div className="text-center p-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900">0 Seg</p>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Conciliación Manual</p>
        </div>
        <div className="text-center p-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900">&lt; 1 Clic</p>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Cancelación Transparente</p>
        </div>
        <div className="text-center p-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900">256-bit</p>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Cifrado Bancario</p>
        </div>
      </div>
    </div>
  );
};