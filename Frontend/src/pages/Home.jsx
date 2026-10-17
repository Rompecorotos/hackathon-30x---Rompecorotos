import React from 'react';

export const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Sección Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        
        {/* Etiqueta de versión */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Plataforma de Cobro Recurrente Certificada v4.8 Core Engine
        </div>

        {/* Título principal */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Automatiza tus cobros con Débito Automático inteligente
        </h1>

        {/* Descripción */}
        <p className="text-lg text-slate-600">
          Infraestructura bancaria de suscripciones diseñada para eliminar el cobro manual, reducir la fricción de pago y garantizar ingresos predecibles en escala enterprise.
        </p>

        {/* Botones de acción rápida */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a
            href="/register"
            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 shadow-sm transition-all"
          >
            Comenzar Ahora
          </a>
          <a
            href="/planes"
            className="px-6 py-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Ver Planes y Precios
          </a>
        </div>
      </div>

      {/* Sección de Métricas / Confianza */}
      <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900">99.98%</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Efectividad de Débito</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900">0 Segundos</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Conciliación Manual</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900">&lt; 1 Clic</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Cancelación Transparente</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900">256-bit</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Cifrado Bancario</p>
        </div>
      </div>
    </div>
  );
};