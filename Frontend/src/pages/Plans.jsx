import React from 'react';
import { PlanCard } from '../components/PlanCard'; // Correcto: PlanCard

export const Plans = () => {
  const planes = [
    {
      title: 'Starter / PYME',
      description: 'Ideal para emprendimientos y startups que inician la automatización de cobros.',
      price: '$29',
      period: '/ mes + 1.2%',
      isPopular: false,
      buttonText: 'Empezar Gratis',
      features: [
        'Hasta 250 suscripciones activas',
        'Débito automático en tarjetas de crédito',
        'Módulo de reintentos estándar',
        'Conciliación contable básica',
        'Soporte por correo electrónico',
      ],
      customFooterText: 'Sin compromiso de permanencia',
    },
    {
      title: 'Pro Scale',
      description: 'Diseñado para empresas en crecimiento con alto volumen de cobro mensual.',
      price: '$79',
      period: '/ mes + 0.8%',
      isPopular: true,
      badgeText: 'Recomendado',
      buttonText: 'Comenzar Prueba Pro',
      features: [
        'Suscripciones ilimitadas',
        'Débito directo en cuenta bancaria + Tarjetas',
        'Smart Retries con Inteligencia de Pagos',
        'Integración por API & Webhooks en tiempo real',
        'Soporte prioritario 24/7 con ejecutivo dedicado',
        'Panel de analíticas avanzadas y churn rate',
      ],
      customFooterText: '14 días de prueba sin tarjeta',
    },
    {
      title: 'Enterprise Custom',
      description: 'Infraestructura dedicada a medida para grandes corporaciones y fintechs.',
      price: 'A medida',
      period: '',
      isPopular: false,
      buttonText: 'Contactar Ventas',
      buttonLink: '/contacto',
      features: [
        'Volumen masivo transaccional personalizado',
        'Múltiples adquirentes y enrutamiento inteligente',
        'Acuerdo de nivel de servicio (SLA) del 99.99%',
        'Servidores dedicados y cumplimiento PCI-DSS Nivel 1',
        'Acompañamiento en migración de base de datos',
      ],
      customFooterText: 'Facturación anual o personalizada',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <span className="text-xs font-bold tracking-widest text-[#2B2E4A] uppercase bg-slate-100 px-3 py-1 rounded-full">
          PLANES Y TARIFAS
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2B2E4A] tracking-tight">
          Escala tus ingresos recurrentes sin sorpresas
        </h1>
        <p className="text-base sm:text-lg text-slate-600">
          Elige la infraestructura que mejor se adapte al volumen de tu negocio. Cancela o cambia de plan cuando quieras.
        </p>
      </div>

      {/* Grid de Tarjetas de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {planes.map((plan, index) => (
          <PlanCard key={index} {...plan} />
        ))}
      </div>
    </div>
  );
};