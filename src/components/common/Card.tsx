import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-card/80 backdrop-blur-sm border border-dark-200 rounded-xl shadow-glass ${
        hover ? 'hover:shadow-xl hover:border-dark-300 transition-all duration-300' : ''
      } ${className}`}
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
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