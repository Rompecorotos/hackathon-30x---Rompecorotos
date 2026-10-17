import React from 'react';

export const PageTransition = ({ children }) => {
  return (
    <div className="animate-fadeInSlide w-full">
      {children}
    </div>
  );
};