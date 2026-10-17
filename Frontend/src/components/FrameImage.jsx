import React from 'react';

export const FrameImage = ({ src, alt, caption }) => {
  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Barra superior estilo ventana moderna */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400 inline-block"></span>
          <span className="h-3 w-3 rounded-full bg-amber-400 inline-block"></span>
          <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block"></span>
        </div>
        <div className="text-xs font-medium text-slate-400 truncate max-w-[250px] sm:max-w-md">
          {alt || 'Vista previa de la plataforma'}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Contenedor de la Imagen */}
      <div className="p-2 sm:p-4 bg-slate-900/5 flex justify-center items-center">
        <img
          src={src}
          alt={alt}
          className="rounded-lg object-contain max-h-[500px] w-full shadow-inner"
        />
      </div>

      {/* Pie de foto opcional */}
      {caption && (
        <div className="border-t border-slate-100 bg-white px-4 py-2.5 text-center text-xs text-slate-500 font-medium">
          {caption}
        </div>
      )}
    </div>
  );
};