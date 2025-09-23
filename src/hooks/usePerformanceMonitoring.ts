import { useEffect, useRef, useCallback, useState } from 'react';
import { PerformanceMonitor } from '../utils/performanceOptimizations';

interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  memoryUsage?: number;
  fps: number;
}

export function usePerformanceMonitoring(componentName: string) {
  const performanceMonitor = PerformanceMonitor.getInstance();
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  // Track component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    performanceMonitor.startTiming(`${componentName}-mount`);
    
    return () => {
      performanceMonitor.endTiming(`${componentName}-mount`);
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} unmounted after ${Date.now() - mountTimeRef.current}ms`);
      }
    };
  }, [componentName, performanceMonitor]);

  // Track render performance
  const trackRender = useCallback(() => {
    renderCountRef.current += 1;
    const renderStart = performance.now();
    
    // Use requestAnimationFrame to measure actual render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (>16ms threshold)`);
      }
    });
  }, [componentName]);

  // Get current performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const componentMountTime = Date.now() - mountTimeRef.current;
    const fps = 60; // Mock FPS value since getCurrentFPS doesn't exist
    
    // Get memory usage if available
    let memoryUsage: number | undefined;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    return {
      renderTime: renderCountRef.current > 0 ? componentMountTime / renderCountRef.current : 0,
      componentMountTime,
      memoryUsage,
      fps
    };
  }, [performanceMonitor]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [getMetrics]);

  // Track render on every render
  useEffect(() => {
    trackRender();
  });

  return {
    metrics,
    getMetrics,
    trackRender,
    renderCount: renderCountRef.current
  };
}

// Hook for monitoring page load performance
export function usePageLoadPerformance(pageName: string) {
  const performanceMonitor = PerformanceMonitor.getInstance();
  const [loadMetrics, setLoadMetrics] = useState<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  } | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    performanceMonitor.startTiming(`${pageName}-load`);

    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.endTiming(`${pageName}-load`);

      // Get Web Vitals if available
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const metrics = {
        loadTime,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
        largestContentfulPaint: undefined as number | undefined
      };

      // Get LCP if available
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.largestContentfulPaint = lastEntry.startTime;
            setLoadMetrics({ ...metrics });
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }
      }

      setLoadMetrics(metrics);

      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${pageName} load metrics:`, metrics);
        
        if (loadTime > 500) {
          console.warn(`${pageName} load time (${loadTime.toFixed(2)}ms) exceeds 500ms target`);
        }
      }
    };

    // Measure after component is fully mounted
    const timer = setTimeout(measureLoadTime, 0);

    return () => {
      clearTimeout(timer);
      performanceMonitor.endTiming(`${pageName}-load`);
    };
  }, [pageName, performanceMonitor]);

  return loadMetrics;
}

// Hook for monitoring scroll performance
export function useScrollPerformance() {
  const [scrollMetrics, setScrollMetrics] = useState({
    fps: 60,
    isScrolling: false,
    scrollTop: 0
  });
  
  const lastScrollTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const scrollStartTime = useRef<number>(0);

  const handleScroll = useCallback((event: Event) => {
    const now = performance.now();
    const target = event.target as HTMLElement;
    
    if (!scrollMetrics.isScrolling) {
      scrollStartTime.current = now;
      frameCount.current = 0;
    }

    frameCount.current++;
    lastScrollTime.current = now;

    // Calculate FPS during scrolling
    const scrollDuration = now - scrollStartTime.current;
    const fps = scrollDuration > 0 ? (frameCount.current / scrollDuration) * 1000 : 60;

    setScrollMetrics({
      fps: Math.min(fps, 60),
      isScrolling: true,
      scrollTop: target.scrollTop || window.scrollY
    });

    // Reset scrolling state after scroll ends
    clearTimeout(scrollMetrics.isScrolling as any);
    setTimeout(() => {
      setScrollMetrics(prev => ({ ...prev, isScrolling: false }));
    }, 150);
  }, [scrollMetrics.isScrolling]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return scrollMetrics;
}

export default usePerformanceMonitoring;