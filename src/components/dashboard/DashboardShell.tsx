'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  KanbanSquare
} from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  userProfile: {
    fullName: string | null
    companyName: string | null
    email: string | null
  }
}

/**
 * Reusable layout shell managing responsive sidebar navigation, semantic headers,
 * accessibilities (ARIA, focus management), and session states across all authenticated routes.
 */
export default function DashboardShell({ children, userProfile }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const supabase = createClient()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'CRM Board', href: '/crm', icon: KanbanSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userInitials = userProfile.fullName
    ? userProfile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US'

  // ESC key closes mobile sidebar
  useEffect(() => {
    if (!isMobileMenuOpen || isMobileMenuClosing) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileMenuOpen, isMobileMenuClosing])

  // Body scroll lock while mobile sidebar is fully open
  useEffect(() => {
    if (isMobileMenuOpen && !isMobileMenuClosing) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen, isMobileMenuClosing])

  // Focus previously-focused trigger button when sidebar closes
  useEffect(() => {
    if (!isMobileMenuOpen && !isMobileMenuClosing && triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [isMobileMenuOpen, isMobileMenuClosing])

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuClosing(false)
    setIsMobileMenuOpen(true)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuClosing(true)
    setTimeout(() => {
      setIsMobileMenuOpen(false)
      setIsMobileMenuClosing(false)
    }, 250)
  }, [])

  return (
    <div className="min-h-screen bg-background flex text-text-primary antialiased selection:bg-primary-custom/20 w-full min-w-0 overflow-x-hidden">

      {/* 1. Desktop Sidebar (Width: 280px, WCAG Semantic Aside) */}
      <aside
        role="complementary"
        aria-label="Main Sidebar Navigation"
        className="hidden md:flex flex-col w-[280px] bg-surface border-r border-border-custom shrink-0 fixed inset-y-0 left-0 z-20 transition-all duration-150"
      >
        {/* Brand/Logo Area */}
        <div className="h-[72px] flex items-center px-6 border-b border-border-custom">
          <Link
            href="/dashboard"
            aria-label="HVAC AI Platform Home"
            className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-custom focus-visible:ring-offset-2 outline-none"
          >
            <div className="h-7 w-7 rounded-lg bg-primary-custom flex items-center justify-center text-white font-bold text-xs shadow-sm select-none">
              H
            </div>
            <span className="font-semibold text-sm tracking-tight select-none">HVAC AI</span>
          </Link>
        </div>

        {/* Sidebar Nav Links (WCAG Semantic Navigation) */}
        <nav
          role="navigation"
          aria-label="Desktop Navigation Links"
          className="flex-1 px-4 py-6 space-y-1 overflow-y-auto"
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary-custom focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary-custom/10 text-primary-custom'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
                style={{ transition: 'background-color 150ms ease, color 150ms ease' }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ transition: 'color 150ms ease' }} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout Area */}
        <div className="p-4 border-t border-border-custom bg-background/50 select-none">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-primary-custom/10 text-primary-custom flex items-center justify-center font-bold text-xs border border-primary-custom/20">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate leading-tight">{userProfile.fullName || 'User'}</p>
              <p className="text-[10px] font-bold text-text-secondary truncate mt-0.5 uppercase tracking-wider">{userProfile.companyName || 'HVAC Company'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sign Out of HVAC console"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 border border-border-custom rounded-lg text-sm font-bold text-danger-custom hover:bg-danger-custom/10 outline-none focus-visible:ring-2 focus-visible:ring-danger-custom focus-visible:ring-offset-2 cursor-pointer"
            style={{ transition: 'background-color 150ms ease' }}
          >
            <LogOut className="h-4 w-4 shrink-0" style={{ transition: 'color 150ms ease' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Responsive Drawer (A11y Compliant) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/30 backdrop-blur-xs transition-all duration-[250ms] ease-out ${
              isMobileMenuClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Sidebar */}
          <aside
            className={`relative flex flex-col w-[280px] max-w-xs bg-surface h-full z-10 p-5 border-r border-border-custom ${
              isMobileMenuClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'
            }`}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-extrabold text-lg select-none">HVAC AI</span>
              <button
                onClick={closeMobileMenu}
                aria-label="Close Mobile Navigation Menu"
                className="p-1.5 rounded-lg hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary-custom cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav role="navigation" aria-label="Mobile Navigation Links" className="space-y-1.5 flex-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary-custom ${
                      isActive
                        ? 'bg-primary-custom/10 text-primary-custom'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    }`}
                    style={{ transition: 'background-color 150ms ease, color 150ms ease' }}
                  >
                    <Icon className="h-4 w-4 shrink-0" style={{ transition: 'color 150ms ease' }} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="pt-4 border-t border-border-custom">
              <button
                onClick={handleLogout}
                aria-label="Sign Out of HVAC console"
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 border border-border-custom rounded-lg text-sm font-bold text-danger-custom hover:bg-danger-custom/10 outline-none focus-visible:ring-2 focus-visible:ring-danger-custom focus-visible:ring-offset-2 cursor-pointer"
                style={{ transition: 'background-color 150ms ease' }}
              >
                <LogOut className="h-4 w-4 shrink-0" style={{ transition: 'color 150ms ease' }} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col md:pl-[280px] min-w-0 w-full">

        {/* Top Header (Height: 72px, role: banner) */}
        <header
          role="banner"
          className="h-[72px] bg-surface border-b border-border-custom flex items-center justify-between px-6 sticky top-0 z-10 select-none"
        >
          <div className="flex items-center gap-4">
            <button
              ref={triggerRef}
              onClick={openMobileMenu}
              aria-label="Open Mobile Navigation Menu"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-1.5 rounded-lg hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary-custom cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">

            {/* Breadcrumb Info Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-text-secondary/70">
              <span className="font-medium">{userProfile.companyName || 'Enterprise'}</span>
              <ChevronRight className="h-3 w-3 text-text-muted" />
              <span className="font-medium text-text-primary capitalize">{pathname.replace('/', '')}</span>
            </div>
          </div>
        </header>

        {/* 4. Page Content (Max width: 1600px, padding: 32px) */}
        <main
          role="main"
          className="flex-1 w-full max-w-[1600px] mx-auto p-5 md:p-6 lg:p-8 animate-fade-in min-w-0"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
