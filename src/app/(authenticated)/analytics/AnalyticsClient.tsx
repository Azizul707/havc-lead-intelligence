/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  Users, Sparkles, AlertTriangle, TrendingUp,
  Calendar, AlertCircle, Activity, ChevronRight
} from 'lucide-react'

interface Lead {
  id: string
  created_at: string
  city: string
  service_type: string
  priority: string
  lead_score: number
  urgency: string
  status: string
  lead_quality: string
}

interface AnalyticsClientProps {
  leads: Lead[]
  totalLeads: number
  averageScore: number
  emergencyPercent: number
  conversionRate: number
  serviceData: { name: string; count: number }[]
  qualityData: { name: string; value: number; color: string }[]
  monthlyData: { month: string; leads: number }[]
  weeklyData: { name: string; leads: number }[]
  emergencyData: { name: string; value: number; color: string }[]
  funnelData: { name: string; value: number }[]
}

export default function AnalyticsClient({
  leads,
  totalLeads,
  averageScore,
  emergencyPercent,
  conversionRate,
  serviceData,
  qualityData,
  monthlyData,
  weeklyData,
  emergencyData,
  funnelData
}: AnalyticsClientProps) {
  // Memoized chart data computed server-side — not re-computing here

  const cityData = useMemo(() => {
    const cities = Array.from(new Set(leads.map(l => l.city)))
    return cities.map(city => {
      const count = leads.filter(l => l.city === city).length
      return { name: city, Count: count }
    })
  }, [leads])

  const priorityData = useMemo(() => {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const colors = ['#9CA3AF', '#2563EB', '#F59E0B', '#EF4444']
    return priorities.map((p, idx) => {
      const count = leads.filter(l => l.priority === p).length
      return { name: p, value: count, color: colors[idx] }
    }).filter(p => p.value > 0)
  }, [leads])

  const hasData = totalLeads > 0

  if (!hasData) {
    return (
      <div className="space-y-5">
        <div className="pb-5 border-b border-border-custom">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary/80 mt-0.5">Executive-level lead intelligence and metrics.</p>
        </div>
        <div className="bg-surface rounded-card border border-border-custom shadow-sm flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="h-12 w-12 rounded-xl border border-border-custom/50 flex items-center justify-center text-text-muted mb-4">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">No analytics data</h3>
          <p className="text-xs text-text-secondary/70 max-w-sm leading-relaxed">
            Analytics will appear once leads are received and processed by the ingestion workflow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="pb-5 border-b border-border-custom">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary/80 mt-0.5">Executive-level lead intelligence and metrics.</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Total Leads</span>
            <div className="h-8 w-8 rounded-lg bg-primary-custom/8 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary-custom" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{totalLeads.toLocaleString()}</span>
            <span className="text-xs font-medium text-text-secondary/70">leads</span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Avg Lead Score</span>
            <div className="h-8 w-8 rounded-lg bg-primary-custom/8 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-custom" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-primary-custom">{averageScore}</span>
            <span className="text-xs font-medium text-text-secondary/70">/ 100</span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Emergency</span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${emergencyPercent > 0 ? 'bg-danger-custom/8' : 'bg-text-secondary/8'}`}>
              <AlertTriangle className={`h-4 w-4 ${emergencyPercent > 0 ? 'text-danger-custom' : 'text-text-muted'}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{emergencyPercent}<span className="text-lg font-medium text-text-secondary/70">%</span></span>
            <span className="text-xs font-medium text-text-secondary/70">of leads</span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-card border border-border-custom shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-secondary/80 tracking-wide uppercase">Conversion Rate</span>
            <div className="h-8 w-8 rounded-lg bg-success-custom/8 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success-custom" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{conversionRate}<span className={`text-lg font-medium ${conversionRate > 0 ? 'text-success-custom' : 'text-text-secondary/70'}`}>%</span></span>
            <span className="text-xs font-medium text-text-secondary/70">completed</span>
          </div>
        </div>
      </div>

      {/* Monthly Trend + Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Monthly Trend */}
        <div className="lg:col-span-8 bg-surface rounded-card border border-border-custom shadow-sm card-hover">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Monthly Lead Trend</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Ingested leads aggregated by month.</p>
          </div>
          <div className="p-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  labelClassName="font-semibold text-text-primary"
                />
                <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={2} fillOpacity={0.06} fill="url(#colorMonthly)" />
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Priority Breakdown</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Lead priority distribution.</p>
          </div>
          {priorityData.length > 0 ? (
            <div className="flex-1 p-5 flex flex-col items-center justify-center gap-3">
              <div className="h-40 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center leading-none">
                  <span className="text-xl font-bold tracking-tight text-text-primary">{totalLeads}</span>
                  <span className="text-[10px] font-medium text-text-muted/80 tracking-wider uppercase mt-0.5">Leads</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full max-w-[180px]">
                {priorityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-medium text-text-secondary/80">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-10 text-center">
              <p className="text-xs text-text-secondary/60">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Trend + Emergency Analysis + Lead Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Trend */}
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm card-hover">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Weekly Comparison</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Current week vs previous week.</p>
          </div>
          <div className="p-5 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ left: -20 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="leads" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emergency Analysis */}
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Emergency Analysis</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Emergency vs non-emergency breakdown.</p>
          </div>
          {emergencyData.length > 0 ? (
            <div className="flex-1 p-5 flex flex-col items-center justify-center gap-3">
              <div className="h-40 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={emergencyData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {emergencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center leading-none">
                  <span className="text-xl font-bold tracking-tight text-text-primary">{emergencyData.reduce((s, d) => s + d.value, 0)}</span>
                  <span className="text-[10px] font-medium text-text-muted/80 tracking-wider uppercase mt-0.5">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full max-w-[180px]">
                {emergencyData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-medium text-text-secondary/80">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-10 text-center">
              <p className="text-xs text-text-secondary/60">No data available</p>
            </div>
          )}
        </div>

        {/* Lead Quality Distribution */}
        <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Lead Quality</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">AI-qualified lead quality distribution.</p>
          </div>
          {qualityData.length > 0 ? (
            <div className="flex-1 p-5 flex flex-col items-center justify-center gap-3">
              <div className="h-40 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={qualityData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center leading-none">
                  <span className="text-xl font-bold tracking-tight text-text-primary">{qualityData.reduce((s, d) => s + d.value, 0)}</span>
                  <span className="text-[10px] font-medium text-text-muted/80 tracking-wider uppercase mt-0.5">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 w-full max-w-[220px]">
                {qualityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-medium text-text-secondary/80">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-10 text-center">
              <p className="text-xs text-text-secondary/60">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-surface rounded-card border border-border-custom shadow-sm card-hover">
        <div className="px-5 py-4 border-b border-border-custom">
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">Conversion Funnel</h2>
          <p className="text-xs text-text-secondary/70 mt-0.5">Lead counts at each pipeline stage.</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6">
            {funnelData.map((stage, index) => {
              const maxVal = Math.max(...funnelData.map(s => s.value), 1)
              const heightPx = maxVal > 0 ? Math.max(Math.round((stage.value / maxVal) * 100), 36) : 36
              const colors = ['#2563EB', '#F59E0B', '#0EA5E9', '#22C55E']
              return (
                <div key={stage.name} className="flex items-center gap-4 sm:gap-0 sm:flex-col w-full sm:w-auto">
                  {index > 0 && (
                    <ChevronRight className="hidden sm:block h-4 w-4 text-text-muted/50 shrink-0 -ml-3 sm:ml-0 sm:mt-1" />
                  )}
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <div
                      className="w-full sm:w-24 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        height: `${heightPx}px`,
                        minHeight: '36px',
                        maxHeight: '100px',
                        backgroundColor: `${colors[index]}12`,
                        border: `1px solid ${colors[index]}25`,
                      }}
                    >
                      <span className="text-base font-bold" style={{ color: colors[index] }}>{stage.value}</span>
                    </div>
                    <span className="text-[11px] font-medium text-text-secondary/80 mt-1.5 text-center">{stage.name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Service Type Distribution + City Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Service Type */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm card-hover">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">Service Type Distribution</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Lead volume by requested service category.</p>
          </div>
          <div className="p-5 h-64 w-full">
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} margin={{ left: -20 }} layout="vertical">
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary/60 text-xs">No service data</div>
            )}
          </div>
        </div>

        {/* City Distribution */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border-custom shadow-sm card-hover">
          <div className="px-5 py-4 border-b border-border-custom">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">City Distribution</h2>
            <p className="text-xs text-text-secondary/70 mt-0.5">Lead frequency by city.</p>
          </div>
          <div className="p-5 h-64 w-full">
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} margin={{ left: -20 }} layout="vertical">
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="Count" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary/60 text-xs">No city data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
