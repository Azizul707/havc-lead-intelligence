import React, { lazy, Suspense } from 'react';

// Lazy load heavy components (correct relative paths)
export const DashboardCharts = lazy(() => import('../dashboard/DashboardCharts'));
export const LeadDetailsDrawer = lazy(() => import('../dashboard/LeadDetailsDrawer'));

// Loading components
export const DashboardChartsLoading = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
    <div className="lg:col-span-8 h-90 bg-surface border border-border-custom rounded-card animate-pulse flex items-center justify-center text-xs text-text-secondary font-semibold">
      Loading historical lead trend...
    </div>
    <div className="lg:col-span-4 h-90 bg-surface border border-border-custom rounded-card animate-pulse flex items-center justify-center text-xs text-text-secondary font-semibold">
      Loading priority breakdown...
    </div>
  </div>
);

export const LeadDetailsDrawerLoading = () => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="bg-surface border border-border-custom rounded-card p-6 animate-pulse">
      Loading lead details...
    </div>
  </div>
);

// Lazy load utility for components
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loadingComponent?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={loadingComponent || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}