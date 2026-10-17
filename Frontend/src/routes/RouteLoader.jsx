import React from 'react';

export const RouteLoader = () => (
  <div role="status" aria-label="Cargando" className="flex justify-center py-16">
    <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#5BD3C7] border-t-transparent" />
  </div>
);
