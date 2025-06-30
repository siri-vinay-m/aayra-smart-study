// Performance optimization utilities for ultra-fast app performance
// Target: <500ms load times, 60 FPS scrolling

export const PERFORMANCE_CONFIG = {
  // Cache durations
  SESSION_CACHE_DURATION: 30000, // 30 seconds
  REVIEW_CACHE_DURATION: 60000,  // 1 minute
  USER_DATA_CACHE_DURATION: 120000, // 2 minutes
  
  // Pagination limits
  INITIAL_SESSIONS_LIMIT: 20,
  COMPLETED_SESSIONS_LIMIT: 50,
  REVIEWS_LIMIT: 25,
  
  // Debounce delays
  SEARCH_DEBOUNCE: 300,
  SCROLL_DEBOUNCE: 16, // ~60fps
  RESIZE_DEBOUNCE: 100,
  
  // Animation settings
  TRANSITION_DURATION: 150,
  SCROLL_BEHAVIOR: 'smooth' as const,
  
  // Memory management
  MAX_CACHED_ITEMS: 1000,
  CLEANUP_INTERVAL: 300000, // 5 minutes
};

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Optimized requestAnimationFrame wrapper
export function optimizedRAF(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 100 });
  } else {
    requestAnimationFrame(callback);
  }
}

// Memory-efficient array chunking
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Lazy loading utility
export function createLazyLoader<T>(
  loadFunction: () => Promise<T>,
  cacheKey: string,
  cacheDuration = PERFORMANCE_CONFIG.SESSION_CACHE_DURATION
) {
  const cache = new Map<string, { data: T; timestamp: number }>();
  
  return async (): Promise<T> => {
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cacheDuration) {
      return cached.data;
    }
    
    const data = await loadFunction();
    cache.set(cacheKey, { data, timestamp: now });
    
    // Cleanup old cache entries
    if (cache.size > PERFORMANCE_CONFIG.MAX_CACHED_ITEMS) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    return data;
  };
}

// Virtual scrolling helper
export class VirtualScrollManager {
  private itemHeight: number;
  private containerHeight: number;
  private scrollTop = 0;
  
  constructor(itemHeight: number, containerHeight: number) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
  }
  
  getVisibleRange(totalItems: number): { start: number; end: number; offset: number } {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const end = Math.min(start + visibleCount + 2, totalItems); // +2 for buffer
    const offset = start * this.itemHeight;
    
    return { start: Math.max(0, start), end, offset };
  }
  
  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startTiming(label: string): void {
    performance.mark(`${label}-start`);
  }
  
  endTiming(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    const duration = measure.duration;
    
    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    // Keep only last 100 measurements
    const measurements = this.metrics.get(label)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
    
    // Clean up performance entries
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
    
    return duration;
  }
  
  getAverageTime(label: string): number {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }
  
  logPerformanceReport(): void {
    console.group('🚀 Performance Report');
    this.metrics.forEach((times, label) => {
      const avg = this.getAverageTime(label);
      const latest = times[times.length - 1] || 0;
      console.log(`${label}: ${latest.toFixed(2)}ms (avg: ${avg.toFixed(2)}ms)`);
    });
    console.groupEnd();
  }
}

// Image optimization utilities
export const imageOptimization = {
  // Convert image to WebP if supported
  async optimizeImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/webp',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  },
  
  // Lazy load images with intersection observer
  createImageLazyLoader(): IntersectionObserver {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
  }
};

// Bundle size optimization helpers
export const bundleOptimization = {
  // Dynamic import wrapper with error handling
  async loadComponent<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
    try {
      const module = await importFn();
      return module.default;
    } catch (error) {
      console.error('Failed to load component:', error);
      throw error;
    }
  },
  
  // Preload critical resources
  preloadResource(href: string, as: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }
};