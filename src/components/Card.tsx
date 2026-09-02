import React from 'react';

/**
 * Props for the Card wrapper component.
 */
interface CardProps {
  id?: string;
  title?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard reusable container card with clean rounded styling and optional header.
 */
export const Card: React.FC<CardProps> = ({ id, title, icon, children, className = '' }) => {
  return (
    <div
      id={id}
      className={`bg-white rounded-xl p-4 mb-3 shadow-xs border border-slate-100 ${className}`}
    >
      {title && (
        <h2 className="text-[15px] font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          <span>{title}</span>
        </h2>
      )}
      {children}
    </div>
  );
};

