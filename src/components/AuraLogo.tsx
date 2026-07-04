import React from 'react';

interface AuraLogoProps {
  className?: string;
  isRestDay?: boolean;
}

export function AuraLogo({ className = "w-5 h-5", isRestDay = false }: AuraLogoProps) {
  return (
    <img 
      src="/aura-logo.png" 
      alt="Aura Logo" 
      className={`${className} object-contain shrink-0`}
    />
  );
}

export default AuraLogo;
