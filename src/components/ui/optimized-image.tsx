import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  quality?: number;
  priority?: boolean;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = React.memo<OptimizedImageProps>((
  {
    src,
    alt,
    width,
    height,
    className,
    placeholder,
    quality = 75,
    priority = false,
    lazy = true,
    onLoad,
    onError,
    ...props
  }
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [lazy, priority, isInView]);

  // Generate optimized image URL
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // If it's already a data URL or external URL, return as is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, you could implement URL transformation here
    // For example, adding query parameters for optimization services
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    
    const queryString = params.toString();
    return queryString ? `${originalSrc}?${queryString}` : originalSrc;
  }, [width, height, quality]);

  // Generate WebP source if supported
  const getWebPSrc = useCallback((originalSrc: string) => {
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return null;
    }
    
    // Convert extension to WebP
    const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return getOptimizedSrc(webpSrc);
  }, [getOptimizedSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const optimizedSrc = getOptimizedSrc(src);
  const webpSrc = getWebPSrc(src);

  // Don't render anything if not in view and lazy loading is enabled
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={cn('bg-muted animate-pulse', className)}
        style={{ width, height }}
        aria-label={alt}
      />
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center text-muted-foreground text-sm',
          className
        )}
        style={{ width, height }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          style={{
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!placeholder && (
            <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Progressive enhancement with WebP support */}
      <picture>
        {webpSrc && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            'w-full h-full object-cover'
          )}
          {...props}
        />
      </picture>
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;