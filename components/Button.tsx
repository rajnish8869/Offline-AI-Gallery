import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "relative flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden tracking-wide";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 rounded-xl px-6 py-4 border border-blue-400/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl px-6 py-4 border border-slate-700 shadow-md",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl px-6 py-3",
    ghost: "bg-transparent hover:bg-white/5 text-slate-300 rounded-lg px-4 py-2",
    glass: "glass-panel text-white hover:bg-white/10 rounded-xl px-6 py-4 shadow-xl"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="animate-spin h-5 w-5 mr-2" />
      )}
      {!isLoading && icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </button>
  );
};