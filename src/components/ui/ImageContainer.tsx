import React, { useState, useEffect } from 'react';

export interface ImageContainerProps {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  fallbackSrc?: string;
  className?: string;
  objectFit?: 'contain' | 'cover';
}

export default function ImageContainer({
  src,
  alt,
  aspectRatio = 'square',
  fallbackSrc,
  className = '',
  objectFit = 'contain',
}: ImageContainerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Reset states if source changes
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  // Aspect ratio mapping
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'h-auto w-full',
  };

  const containerClasses = `relative overflow-hidden bg-bg-tertiary rounded ${aspectClasses[aspectRatio]} ${className}`;

  // Default fallback avatar in SVG format for missing images
  const defaultFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary/20 p-4">
      <svg
        className="w-1/3 h-1/3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-[10px] uppercase font-bold tracking-wider mt-2 opacity-50">
        Image Load Error
      </span>
    </div>
  );

  return (
    <div className={containerClasses}>
      {/* Skeleton Pulse Shimmer */}
      {loading && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-bg-tertiary via-white/5 to-bg-tertiary bg-[length:200%_100%] animate-shimmer" />
      )}

      {/* Render Image or Fallback */}
      {error ? (
        fallbackSrc ? (
          <img
            src={fallbackSrc}
            alt={alt}
            className={`w-full h-full object-${objectFit}`}
          />
        ) : (
          defaultFallback
        )
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className={`w-full h-full object-${objectFit} transition-all duration-300 ${
            loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        />
      )}
    </div>
  );
}
