import React from 'react';
import { Link } from 'react-router-dom';
import { FaqSection } from '../components/FaqSection';

export const Home = () => {
  return (
    <div className="w-full overflow-hidden relative bg-slate-50/30">
      
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Esfera flotante 1 (Menta Bankly - Arriba izquierda) */}
        <div className="absolute -top-10 -left-10 w-80 h-80 sm:w-[30rem] sm:h-[30rem] bg-gradient-to-br from-[#5BD3C7]/40 to-emerald-300/30 rounded-full blur-3xl animate-pulse duration-10000" />
        
        {/* Esfera flotante 2 (Azul/Índigo - Arriba derecha) */}
        <div className="absolute top-1/4 -right-10 w-96 h-96 sm:w-[35rem] sm:h-[35rem] bg-indigo-400/25 rounded-full blur-3xl animate-pulse duration-7000 delay-1000" />

        {/* Esfera flotante 3 (Soft Purple / Lavender - Centro) */}
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-purple-300/20 rounded-full blur-[100px]" />
      </div>
      {/* ========================================================= */}

      {/* Contenedor principal del Hero y Métricas */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 relative z-10">
        
        {/* Sección Hero con Animación de Entrada (Fade In + Slide Up) */}
        <div className="text-center max-w-3xl mx-auto space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 text-center mx-auto shadow-sm hover:scale-105 transition-transform duration-300 cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0"></span>
            <span className="truncate">Plataforma de Cobro Recurrente Certificada v4.8</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Automatiza tus cobros con <span className="text-[#5BD3C7] bg-clip-text text-transparent bg-gradient-to-r from-[#2B2E4A] to-[#5BD3C7] underline decoration-[#5BD3C7] decoration-wavy decoration-2 underline-offset-8">Débito Automático</span> inteligente
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Infraestructura bancaria de suscripciones diseñada para eliminar el cobro manual, reducir la fricción de pago y garantizar ingresos predecibles en escala enterprise.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-4 w-full">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#5BD3C7] text-[#2B2E4A] font-bold hover:bg-[#4ac3b7] shadow-lg shadow-[#5BD3C7]/20 hover:shadow-xl hover:shadow-[#5BD3C7]/30 transform hover:-translate-y-1 active:translate-y-0 transition-all text-center"
            >
              Comenzar Ahora 🚀
            </Link>
            <Link
              to="/plans"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow transform hover:-translate-y-0.5 transition-all text-center"
            >
              Ver Planes y Precios
            </Link>
          </div>
        </div>

        {/* Sección de Métricas con Tarjetas Animadas en Hover */}
        <div className="mt-16 sm:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/80 shadow-xl shadow-slate-200/50">
          <div className="text-center p-3 rounded-xl hover:bg-white/60 transition-all transform hover:-translate-y-1">
            <p className="text-2xl sm:text-4xl font-black text-slate-900">99.98%</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Efectividad de Débito</p>
          </div>
          <div className="text-center p-3 rounded-xl hover:bg-white/60 transition-all transform hover:-translate-y-1">
            <p className="text-2xl sm:text-4xl font-black text-slate-900">0 Seg</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Conciliación Manual</p>
          </div>
          <div className="text-center p-3 rounded-xl hover:bg-white/60 transition-all transform hover:-translate-y-1">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">&lt; 1 Clic</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Cancelación Transparente</p>
          </div>
          <div className="text-center p-3 rounded-xl hover:bg-white/60 transition-all transform hover:-translate-y-1">
            <p className="text-2xl sm:text-4xl font-black text-slate-900">256-bit</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Cifrado Bancario</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN: Características Clave con Efectos Interactivos */}
      <div className="bg-white/60 backdrop-blur-md py-16 sm:py-24 border-y border-slate-200/60 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Todo lo que necesitas para escalar tus cobros</h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">Herramientas robustas diseñadas para la máxima retención de clientes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Tarjeta 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#2B2E4A] transition-colors">Cobros Automáticos</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Programa cobros recurrentes diarios, semanales o mensuales sin intervención manual ni retrasos.</p>
            </div>

            {/* Tarjeta 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-300">
                🛡️
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#2B2E4A] transition-colors">Anti-Fraude Avanzado</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Protección de nivel bancario con pasarelas certificadas y validación de identidad instantánea.</p>
            </div>

            {/* Tarjeta 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300">
                📊
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#2B2E4A] transition-colors">Panel de Analítica</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Métricas detalladas sobre tasa de éxito, ingresos recurrentes mensuales (MRR) y alertas de pagos.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Sección de Preguntas Frecuentes */}
      <div className="py-8 relative z-10">
        <FaqSection />
      </div>
    </div>
  );
};