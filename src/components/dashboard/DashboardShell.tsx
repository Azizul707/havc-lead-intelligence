'use client'

import React, { useState } from 'react'
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
  Bell,
  Search,
  ChevronRight
} from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  userProfile: {
    fullName: string | null
    companyName: string | null
    email: string | null
  }
}

export default function DashboardShell({ children, userProfile }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const supabase = createClient()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users },
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

  return (
    <div className="min-h-screen bg-background flex text-text-primary">
      
      {/* 1. Desktop Sidebar (Width: 280px) */}
      <aside className="hidden md:flex flex-col w-[280px] bg-surface border-r border-border-custom shrink-0 fixed inset-y-0 left-0 z-20">
        {/* Brand/Logo Area */}
        <div className="h-[72px] flex items-center px-6 border-b border-border-custom">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-button bg-primary-custom flex items-center justify-center text-white font-bold text-sm">
              H
            </div>
            <span className="font-bold text-base tracking-tight">HVAC AI</span>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-custom/10 text-primary-custom' 
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout at bottom */}
        <div className="p-4 border-t border-border-custom bg-background/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-primary-custom/10 text-primary-custom flex items-center justify-center font-semibold text-xs border border-primary-custom/20">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{userProfile.fullName || 'User'}</p>
              <p className="text-xs text-text-secondary truncate mt-0.5">{userProfile.companyName || 'HVAC Company'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-border-custom rounded-button text-sm font-medium text-danger-custom hover:bg-danger-custom/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative flex flex-col w-[280px] max-w-xs bg-surface h-full z-10 p-5 border-r border-border-custom">
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-lg">HVAC AI</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-button hover:bg-background cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="space-y-1.5 flex-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary-custom/10 text-primary-custom' 
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="pt-4 border-t border-border-custom">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-border-custom rounded-button text-sm font-medium text-danger-custom hover:bg-danger-custom/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Main Page Layout Container */}
      <div className="flex-1 flex flex-col md:pl-[280px]">
        
        {/* Top Header (Height: 72px) */}
        <header className="h-[72px] bg-surface border-b border-border-custom flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1 rounded-button hover:bg-background cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search Box - Minimalist Stripe-style */}
            <div className="hidden sm:flex items-center space-x-2 bg-background border border-border-custom rounded-input px-3 py-1.5 w-64 text-text-secondary focus-within:border-primary-custom">
              <Search className="h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                className="bg-transparent border-none outline-none text-sm w-full text-text-primary"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Icon */}
            <button className="p-2 rounded-button hover:bg-background relative text-text-secondary hover:text-text-primary cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger-custom" />
            </button>

            {/* Micro Breadcrumb or Company Name */}
            <div className="hidden lg:flex items-center space-x-2 text-sm text-text-secondary font-medium">
              <span>{userProfile.companyName || 'Enterprise'}</span>
              <ChevronRight className="h-4 w-4 text-text-muted" />
              <span className="text-text-primary capitalize">{pathname.replace('/', '')}</span>
            </div>
          </div>
        </header>

        {/* Page Content Container (Max width: 1600px, padding: 32px) */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}