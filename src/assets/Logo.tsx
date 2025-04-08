
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <img 
      src="/lovable-uploads/2d654513-902b-400d-a342-4f99ed8b9c5b.png" 
      alt="Agentic Browser Logo" 
      className={className}
    />
  );
};

export default Logo;
