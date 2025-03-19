
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff3a3a" />
          <stop offset="100%" stopColor="#3a56e4" />
        </linearGradient>
      </defs>
      {/* Robot-like icon similar to the one in the images */}
      <circle cx="50" cy="35" r="25" fill="url(#logoGradient)" />
      <circle cx="40" cy="30" r="5" fill="white" />
      <circle cx="60" cy="30" r="5" fill="white" />
      <path d="M40 50 Q50 60 60 50" stroke="white" strokeWidth="3" fill="none" />
      <path d="M20 35 Q10 40 15 60" stroke="url(#logoGradient)" strokeWidth="3" fill="none" />
      <path d="M80 35 Q90 40 85 60" stroke="url(#logoGradient)" strokeWidth="3" fill="none" />
    </svg>
  );
};

export default Logo;
