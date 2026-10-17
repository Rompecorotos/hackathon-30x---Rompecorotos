import React, { useState } from 'react';

export const FaqSection = () => {
  // Estado para controlar qué pregunta está abierta (por defecto la primera)
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "¿Cómo funciona exactamente el Débito Automático inteligente?",
      answer: "Al suscribirse, el cliente autoriza un mandato de domiciliación o tokenización de tarjeta. El motor programa y cobra los importes automáticamente en el período fijado, conciliando la factura en tu sistema contable sin requerir envío de enlaces manuales."
    },
    {
      question: "¿Qué ocurre si la tarjeta o cuenta bancaria del cliente no tiene fondos suficientes?",
      answer: "El sistema activa de forma automática un protocolo de reintentos inteligentes (Smart Retries) espaciados en los días de mayor probabilidad de éxito, notificando al pagador de forma transparente para actualizar su método de pago."
    },
    {
      question: "¿Puedo cambiar de plan o cancelar la suscripción en cualquier instante?",
      answer: "Sí, la plataforma permite gestionar prorrateos automáticos, upgrades, downgrades o cancelaciones inmediatas o al término del ciclo de facturación actual con un solo clic."
    },
    {
      question: "¿Qué comisiones cobra la plataforma por procesamiento de cobro?",
      answer: "Manejamos esquemas transparentes basados en un porcentaje competitivo por transacción exitosa combinada con una cuota fija reducida por lote de liquidación bancaria, sin costos ocultos."
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Cabecera de la sección */}
      <div className="text-center space-y-3 mb-12">
        <span className="text-xs font-bold tracking-widest text-[#2B2E4A] uppercase bg-slate-100 px-3 py-1 rounded-full">
          RESOLUCIÓN DE DUDAS
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Preguntas Frecuentes sobre Débito Automático
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Respuestas técnicas y operativas sobre cobro recurrente, comisiones y seguridad.
        </p>
      </div>

      {/* Lista de Acordeones */}
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-[#2B2E4A] hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-base sm:text-lg">{faq.question}</span>
                <span
                  className={`transform transition-transform duration-300 text-slate-500 text-xl font-bold ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  ⌄
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tarjeta inferior de contacto con especialista */}
      <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-[#2B2E4A]">
            ¿Tienes requerimientos bancarios a medida?
          </h3>
          <p className="text-slate-600 text-sm">
            Nuestro equipo de ingeniería financiera te acompaña en la integración directa.
          </p>
        </div>
        <a
          href="/contacto"
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#2B2E4A] text-white font-medium hover:bg-slate-800 transition-all text-center flex-shrink-0 shadow-sm"
        >
          Hablar con un Especialista
        </a>
      </div>
    </section>
  );
};