import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`glass-card glass-effect rounded-xl ${
        hover ? 'hover:shadow-xl hover:border-dark-300 transition-all duration-300' : ''
      } ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none shadow-glass-inset" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};