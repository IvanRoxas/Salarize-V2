import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({ variant = 'primary', className = '', children, disabled, ...props }: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const styles = {
    primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white focus:ring-[var(--color-primary)]',
    secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600',
  };

  return (
    <button 
      className={`${baseStyles} ${styles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
