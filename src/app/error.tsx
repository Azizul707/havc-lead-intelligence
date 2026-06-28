'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home as HomeIcon } from 'lucide-react'
import { logger } from '../lib/logger'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global React Error Boundary to safely intercept uncaught runtime exceptions
 * within the dashboard workspace routes and prevent white screen crashes.
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error securely for diagnostic auditing
    logger.error('Uncaught Client Workspace Crash:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-background text-text-primary">
      <div className="max-w-md w-full text-center space-y-6 bg-surface p-8 rounded-card border border-border-custom shadow-sm">
        
        {/* Error Icon Indicator */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-danger-custom/10 flex items-center justify-center text-danger-custom">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        {/* User-Friendly message */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight">Something went wrong</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            An unexpected error occurred in your workspace. We apologize for the inconvenience. 
            The system operations team has been notified.
          </p>
        </div>

        {/* Action Buttons with hover states */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-primary-custom hover:bg-primary-hover text-white rounded-button text-xs font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 border border-border-custom hover:bg-surface text-text-primary rounded-button text-xs font-semibold cursor-pointer transition-colors"
          >
            <HomeIcon className="h-4 w-4 text-text-secondary" />
            <span>Return to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  )
}