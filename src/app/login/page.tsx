'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      if (isSignUp) {
        const res = await signup(formData)
        if (res.success) {
          setSuccessMsg(res.message || 'Account created successfully. You can now sign in!')
          setIsSignUp(false)
        } else {
          setErrorMsg(res.error || 'An error occurred during sign up.')
        }
      } else {
        const res = await login(formData)
        if (res.success) {
          router.push('/dashboard')
          router.refresh()
        } else {
          setErrorMsg(res.error || 'Invalid login credentials.')
        }
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 rounded-card border border-border-custom shadow-sm">
        
        {/* Branding Area */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-10 w-10 rounded-button bg-primary-custom/10 flex items-center justify-center text-primary-custom">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            HVAC Intelligence Platform
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {isSignUp ? 'Create your business account to get started' : 'Sign in to access your dispatch dashboard'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-4 rounded-input bg-danger-custom/10 text-danger-custom text-sm font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-input bg-success-custom/10 text-success-custom text-sm font-medium">
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-text-secondary mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-text-secondary mb-1">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    placeholder="Apex HVAC Services"
                    className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-background border border-border-custom rounded-input text-text-primary text-sm focus:border-primary-custom"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-button text-sm font-semibold text-white bg-primary-custom hover:bg-primary-hover focus:outline-none disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Toggle Mode Button */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="text-sm font-medium text-primary-custom hover:underline bg-transparent border-none cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign up'}
          </button>
        </div>

      </div>
    </div>
  )
}