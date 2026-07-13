// Performance monitoring utilities for AI Lead Scoring CRM platform

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface RoutePerformance {
  route: string;
  loadTime: number;
  renderTime: number;
  dataFetchTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private routeMetrics: RoutePerformance[] = [];
  private readonly MAX_METRICS = 100;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupPerformanceObservers();
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupPerformanceObservers() {
    // Observe Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime, 'ms');
      });

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Observe First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart: number }
          this.recordMetric('fid', fidEntry.processingStart - fidEntry.startTime, 'ms');
        });
      });

      fidObserver.observe({ type: 'first-input', buffered: true });

      // Observe Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
          if (!clsEntry.hadRecentInput) {
            this.recordMetric('cls', clsEntry.value ?? 0, 'score');
          }
        });
      });

      clsObserver.observe({ type: 'layout-shift', buffered: true });
    }
  }

  recordMetric(name: string, value: number, unit: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}${unit}`);
    }
  }

  recordRoutePerformance(route: string, loadTime: number, renderTime: number, dataFetchTime: number) {
    const routeMetric: RoutePerformance = {
      route,
      loadTime,
      renderTime,
      dataFetchTime,
      timestamp: Date.now(),
    };

    this.routeMetrics.push(routeMetric);
    
    if (this.routeMetrics.length > this.MAX_METRICS) {
      this.routeMetrics = this.routeMetrics.slice(-this.MAX_METRICS);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Route Performance] ${route}: Load=${loadTime}ms, Render=${renderTime}ms, Data=${dataFetchTime}ms`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getRouteMetrics(): RoutePerformance[] {
    return [...this.routeMetrics];
  }

  getAverageLoadTime(): number {
    if (this.routeMetrics.length === 0) return 0;
    const total = this.routeMetrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return total / this.routeMetrics.length;
  }

  getSlowestRoute(): RoutePerformance | null {
    if (this.routeMetrics.length === 0) return null;
    return this.routeMetrics.reduce((slowest, current) => 
      current.loadTime > slowest.loadTime ? current : slowest
    );
  }

  clearMetrics() {
    this.metrics = [];
    this.routeMetrics = [];
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const startTimer = (name: string) => {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        monitor.recordMetric(name, duration, 'ms');
        return duration;
      }
    };
  };

  const measureRoute = (route: string) => {
    const navigationStart = performance.now();
    let renderStart: number;
    let dataFetchStart: number;

    return {
      startRender: () => {
        renderStart = performance.now();
      },
      startDataFetch: () => {
        dataFetchStart = performance.now();
      },
      end: (dataFetchEnd?: number) => {
        const loadTime = performance.now() - navigationStart;
        const renderTime = renderStart ? performance.now() - renderStart : 0;
        const dataFetchTime = dataFetchStart && dataFetchEnd ? dataFetchEnd - dataFetchStart : 0;
        
        monitor.recordRoutePerformance(route, loadTime, renderTime, dataFetchTime);
        
        return { loadTime, renderTime, dataFetchTime };
      }
    };
  };

  return {
    startTimer,
    measureRoute,
    getMetrics: () => monitor.getMetrics(),
    getRouteMetrics: () => monitor.getRouteMetrics(),
    getAverageLoadTime: () => monitor.getAverageLoadTime(),
    getSlowestRoute: () => monitor.getSlowestRoute(),
    clearMetrics: () => monitor.clearMetrics(),
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Development performance dashboard component
export function PerformanceDashboard() {
  const { getMetrics, getRouteMetrics, getAverageLoadTime, getSlowestRoute, clearMetrics } = usePerformanceMonitor();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const metrics = getMetrics();
  const routeMetrics = getRouteMetrics();
  const averageLoadTime = getAverageLoadTime();
  const slowestRoute = getSlowestRoute();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-surface border border-border-custom rounded-card p-4 max-w-sm max-h-96 overflow-auto shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Performance Monitor</h3>
        <button 
          onClick={clearMetrics}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Clear
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="text-xs">
          <div className="text-text-secondary">Avg Load Time:</div>
          <div className="font-medium text-text-primary">{averageLoadTime.toFixed(1)}ms</div>
        </div>
        
        {slowestRoute && (
          <div className="text-xs">
            <div className="text-text-secondary">Slowest Route:</div>
            <div className="font-medium text-text-primary">{slowestRoute.route}</div>
            <div className="text-text-muted">{slowestRoute.loadTime.toFixed(1)}ms</div>
          </div>
        )}
        
        {routeMetrics.slice(-5).reverse().map((metric, index) => (
          <div key={index} className="text-xs border-t border-border-custom pt-2">
            <div className="font-medium text-text-primary">{metric.route}</div>
            <div className="grid grid-cols-3 gap-1 text-text-muted">
              <span>Load: {metric.loadTime.toFixed(0)}ms</span>
              <span>Render: {metric.renderTime.toFixed(0)}ms</span>
              <span>Data: {metric.dataFetchTime.toFixed(0)}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}