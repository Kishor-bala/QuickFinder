import React from 'react';

export function Card({ children, className = '', hoverEffect = false, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${
        hoverEffect ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300 transform hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`p-6 border-b border-slate-100 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`p-4 bg-slate-50 border-t border-slate-100 ${className}`}>{children}</div>;
}

export default Card;
