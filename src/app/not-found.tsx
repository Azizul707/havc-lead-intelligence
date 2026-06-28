'use client'

import { useRouter } from 'next/navigation'
import { HelpCircle, ArrowLeft, Home } from 'lucide-react'

/**
 * Production-ready Custom 404 Not Found Page.
 * Displays a friendly minimal message and provides clear navigation recovery actions.
 */
export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-surface p-8 rounded-card border border-border-custom shadow-sm animate-fade-in">
        
        {/* Subtle Help/NotFound Icon */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-primary-custom/10 flex items-center justify-center text-primary-custom">
            <HelpCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Friendly messaging */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Page not found</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            The link you followed may be broken, or the page has been relocated. 
            Please verify the address or use the navigation actions below.
          </p>
        </div>

        {/* Navigation Recovery Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 border border-border-custom hover:bg-background text-text-primary rounded-button text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-text-secondary" />
            <span>Go Back</span>
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-custom hover:bg-primary-hover text-white rounded-button text-xs font-semibold cursor-pointer transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  )
}