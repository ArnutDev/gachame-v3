import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export default function Card({
  children,
  hoverable = false,
  glow = false,
  className = '',
  ...props
}: CardProps) {
  // Base classes for the card (including glassmorphism by default)
  const baseClasses = 'bg-bg-secondary/45 backdrop-blur-md border border-border-color rounded-lg p-5 transition-all duration-300';
  
  // Toggle hover effect classes
  const hoverClasses = hoverable 
    ? 'hover:-translate-y-1 hover:border-accent-cyan/35 hover:shadow-lg hover:shadow-accent-cyan/5 cursor-pointer' 
    : '';

  // Toggle neon theme glow classes
  const glowClasses = glow 
    ? 'border-accent-cyan/25 shadow-md shadow-accent-cyan/5 ring-1 ring-accent-cyan/10' 
    : '';

  const combinedClasses = `${baseClasses} ${hoverClasses} ${glowClasses} ${className}`;

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}
