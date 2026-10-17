import React from 'react';
import { FrameImage } from '../components/FrameImage';

export const Documentation = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-left">
      {/* Cabecera */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <span className="text-xs font-bold tracking-widest text-[#2B2E4A] uppercase bg-slate-100 px-3 py-1 rounded-full">
          DOCUMENTACIÓN TÉCNICA Y VISIÓN
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2B2E4A] tracking-tight">
          Inteligencia de Pagos al Servicio de las Empresas
        </h1>
        <p className="text-base sm:text-lg text-slate-600">
          Conoce el propósito, la arquitectura y el stack tecnológico detrás del motor de cobro recurrente de Bankly.
        </p>
      </div>

      {/* Sección 1: La Idea */}
      <section className="space-y-4 mb-12">
        <h2 className="text-2xl font-bold text-[#2B2E4A] flex items-center gap-2">
          <span className="text-[#5BD3C7]">#</span> 1. ¿Qué idea estamos desarrollando?
        </h2>
        <p className="text-slate-600 leading-relaxed">
          <strong>Bankly</strong> es una infraestructura de suscripciones y cobro recurrente automatizado diseñada para eliminar la fricción de los pagos manuales. Permite a las empresas configurar mandatos de domiciliación inteligente, tokenización de tarjetas y reintentos automáticos para garantizar ingresos predecibles sin requerir intervención humana constante.
        </p>

        <FrameImage
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
          alt="Arquitectura del motor de pagos y analíticas"
          caption="Figura 1.1: Flujo general del motor de procesamiento y conciliación automática."
        />
      </section>

      {/* Sección 2: El Porqué */}
      <section className="space-y-4 mb-12">
        <h2 className="text-2xl font-bold text-[#2B2E4A] flex items-center gap-2">
          <span className="text-[#5BD3C7]">#</span> 2. ¿Por qué lo estamos haciendo?
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Tradicionalmente, la gestión de cobros recurrentes y facturación en escala enterprise depende de procesos manuales propensos a errores, enlaces de pago dispersos y altos índices de fallo por fondos insuficientes.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Lo estamos haciendo para dotar a las organizaciones de una capa de software robusta, transparente y segura que asegure la predictibilidad financiera, reduzca la tasa de cancelación involuntaria (churn) y optimice el tiempo operativo de los equipos administrativos.
        </p>
      </section>

      {/* Sección 3: Stack Tecnológico */}
      <section className="space-y-6 mb-8">
        <h2 className="text-2xl font-bold text-[#2B2E4A] flex items-center gap-2">
          <span className="text-[#5BD3C7]">#</span> 3. Herramientas y Stack Tecnológico
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Para garantizar una experiencia ultrarrápida, escalable y con estándares de seguridad bancaria, la plataforma se fundamenta en las siguientes tecnologías:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <h3 className="font-bold text-[#2B2E4A] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5BD3C7]"></span> React & Vite
            </h3>
            <p className="text-sm text-slate-500">
              Utilizado para construir una interfaz de usuario modular, altamente reactiva y optimizada para la navegación dinámica en el cliente.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <h3 className="font-bold text-[#2B2E4A] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5BD3C7]"></span> Tailwind CSS
            </h3>
            <p className="text-sm text-slate-500">
              Framework de diseño utilitario que permite aplicar una capa visual moderna, consistente y 100% responsiva adaptada a nuestra paleta de colores.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <h3 className="font-bold text-[#2B2E4A] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5BD3C7]"></span> Supabase
            </h3>
            <p className="text-sm text-slate-500">
              Base de datos backend-as-a-service para la gestión segura de autenticación de usuarios, perfiles, mandatos de pago y registros de auditoría en tiempo real.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <h3 className="font-bold text-[#2B2E4A] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5BD3C7]"></span> Next.js
            </h3>
            <p className="text-sm text-slate-500">
              Soporte de renderizado híbrido (SSR/SSG) enfocado en la optimización para motores de búsqueda (SEO) y rendimiento óptimo en despliegues institucionales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};