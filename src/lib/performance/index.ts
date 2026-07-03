import { performanceMonitor, PerformanceDashboard, usePerformanceMonitor } from './monitor';

// Export performance utilities
export { performanceMonitor, PerformanceDashboard, usePerformanceMonitor };

// Performance optimization utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Image optimization helper
export function optimizeImageUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}): string {
  if (!url || url.startsWith('data:')) return url;
  
  const params = new URLSearchParams();
  if (options?.width) params.set('w', options.width.toString());
  if (options?.height) params.set('h', options.height.toString());
  if (options?.quality) params.set('q', options.quality.toString());
  if (options?.format) params.set('fm', options.format);
  
  // For external URLs, you might need to use a proxy or CDN
  // This is a placeholder for actual implementation
  return params.toString() ? `${url}?${params.toString()}` : url;
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Clean up expired cache entries periodically
    setInterval(() => this.cleanup(), this.CACHE_TTL);
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Enforce max cache size
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number } {
    // Simple stats - in a real implementation, track hits/misses
    return {
      size: this.cache.size,
      hitRate: 0, // Placeholder
    };
  }
}

// Bundle analysis helper (for development)
export function analyzeBundle() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const scripts = resources.filter(r => r.name.includes('.js'))
    const styles = resources.filter(r => r.name.includes('.css'))

    console.group('[Bundle Analysis]')
    console.log('Scripts:', scripts.map(s => ({
      name: s.name.split('/').pop(),
      size: s.transferSize,
      duration: s.duration,
    })))
    console.log('Styles:', styles.map(s => ({
      name: s.name.split('/').pop(),
      size: s.transferSize,
      duration: s.duration,
    })))
    console.groupEnd()
  }
}

// Export memory manager singleton
export const memoryManager = MemoryManager.getInstance();