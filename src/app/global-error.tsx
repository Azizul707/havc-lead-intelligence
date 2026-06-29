'use client'

import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Root level layout fallback boundary to handle fatal runtime crashes.
 * Enforces strict HTML and Body structures as required by Next.js.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Log fatal crashes immediately
  console.error('Fatal Application Crash:', error)

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 text-[#111827] font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm">
          
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight">System Interruption</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              A fatal infrastructure exception was intercepted. Please recover the session below.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => reset()}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Recover Session</span>
            </button>
          </div>

        </div>
      </body>
    </html>
  )
}
