import React from 'react';

export const FormCard = ({ title, subtitle, onSubmit, submitText, children, isLoading = false }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      {/* Encabezado del Formulario */}
      {(title || subtitle) && (
        <div className="text-center space-y-1">
          {title && <h2 className="text-2xl font-extrabold text-[#2B2E4A]">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}

      {/* Cuerpo del Formulario */}
      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        {/* Botón Principal de Envío */}
        {submitText && (
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#5BD3C7] text-[#2B2E4A] font-bold text-sm hover:bg-[#4ac3b7] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5BD3C7]/50 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#2B2E4A] border-t-transparent rounded-full animate-spin"></span>
                <span>Procesando...</span>
              </>
            ) : (
              submitText
            )}
          </button>
        )}
      </form>
    </div>
  );
};