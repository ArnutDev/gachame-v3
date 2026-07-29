import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'ค้นหาตามชื่อ...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative w-full max-w-xs ${className}`}>
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-1.5 border border-border-color bg-bg-secondary/40 text-text-primary rounded-lg text-xs sm:text-sm focus:outline-none focus:border-accent-cyan/60 transition-all placeholder:text-text-secondary/30"
      />
    </div>
  );
}
