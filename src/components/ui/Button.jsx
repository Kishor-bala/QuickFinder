import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.98]';

  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 focus:ring-brand-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400',
    outline: 'border-2 border-slate-200 hover:border-slate-300 text-slate-700 bg-transparent hover:bg-slate-50 focus:ring-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 focus:ring-rose-500',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-300',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
