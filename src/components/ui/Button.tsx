import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  // Base classes for the button
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-95';

  // Variant mappings matching our premium design
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-accent-cyan to-accent-teal text-bg-primary border-none shadow-lg shadow-accent-cyan/10 hover:opacity-95',
    secondary:
      'bg-accent-cyan/10 text-text-primary border border-accent-cyan/70 hover:border-accent-cyan hover:bg-accent-cyan/20 shadow-md shadow-accent-cyan/10',
    accent:
      'bg-transparent text-accent-cyan border border-accent-cyan/30 hover:border-accent-cyan hover:bg-accent-cyan/5',
    danger: 'bg-error/15 text-error border border-error/30 hover:bg-error/25',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
    outline:
      'bg-transparent text-text-primary border border-border-color hover:border-text-primary/20',
  };

  // Size mappings
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      disabled={disabled || isLoading}
      className={combinedClasses}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="flex items-center">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
