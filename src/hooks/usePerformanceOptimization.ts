import { useEffect, useCallback, useRef } from 'react';
import { APP_CONFIG } from '@/config/app.config';

interface PerformanceMetrics {
  loadTime: number;
  fps: number;
  isSlowConnection: boolean;
}

/**
 * Custom hook for performance optimization and monitoring
 * Implements lazy loading, caching, and prefetching strategies
 */
export const usePerformanceOptimization = () => {
  const performanceRef = useRef<PerformanceMetrics>({
    loadTime: 0,
    fps: 0,
    isSlowConnection: false
  });
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  /**
   * Measures and monitors FPS for smooth scrolling
   */
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      performanceRef.current.fps = frameCountRef.current;
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      // Log warning if FPS drops below target
      if (performanceRef.current.fps < APP_CONFIG.performance.targetFPS) {
        console.warn(`FPS below target: ${performanceRef.current.fps}/${APP_CONFIG.performance.targetFPS}`);
      }
    }
    
    requestAnimationFrame(measureFPS);
  }, []);

  /**
   * Detects connection speed for adaptive loading
   */
  const detectConnectionSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const slowConnections = ['slow-2g', '2g', '3g'];
      performanceRef.current.isSlowConnection = slowConnections.includes(connection.effectiveType);
    }
  }, []);

  /**
   * Implements lazy loading for images and components
   */
  const createLazyLoader = useCallback((threshold = 0.1) => {
    if (!APP_CONFIG.performance.enableLazyLoading) return null;
    
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            
            // Load images
            if (target.tagName === 'IMG') {
              const img = target as HTMLImageElement;
              const dataSrc = img.getAttribute('data-src');
              if (dataSrc) {
                img.src = dataSrc;
                img.removeAttribute('data-src');
              }
            }
            
            // Trigger component loading
            target.classList.add('loaded');
          }
        });
      },
      { threshold }
    );
  }, []);

  /**
   * Prefetches content on stable connections
   */
  const prefetchContent = useCallback((urls: string[]) => {
    if (!APP_CONFIG.performance.enablePrefetch || performanceRef.current.isSlowConnection) {
      return;
    }
    
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);

  /**
   * Optimizes scroll performance
   */
  const optimizeScrolling = useCallback(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Scroll optimization logic here
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Measures page load time
   */
  const measureLoadTime = useCallback(() => {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      performanceRef.current.loadTime = loadTime;
      
      if (loadTime > APP_CONFIG.performance.targetLoadTime) {
        console.warn(`Load time exceeded target: ${loadTime}ms > ${APP_CONFIG.performance.targetLoadTime}ms`);
      }
    }
  }, []);

  useEffect(() => {
    // Initialize performance monitoring
    detectConnectionSpeed();
    measureLoadTime();
    
    // Start FPS monitoring
    if (APP_CONFIG.performance.targetFPS > 0) {
      requestAnimationFrame(measureFPS);
    }
    
    // Optimize scrolling
    const cleanupScroll = optimizeScrolling();
    
    return cleanupScroll;
  }, [detectConnectionSpeed, measureLoadTime, measureFPS, optimizeScrolling]);

  return {
    performanceMetrics: performanceRef.current,
    createLazyLoader,
    prefetchContent,
    isSlowConnection: performanceRef.current.isSlowConnection
  };
};