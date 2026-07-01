/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Executive Intelligence Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Cross-sectional charts and deep metrics computed dynamically.</p>
        </div>
        <div className="bg-surface rounded-card border border-border-custom shadow-sm p-16 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-border-custom/30 flex items-center justify-center text-text-secondary">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary">No Analytics Data</h3>
          <p className="text-sm text-text-secondary max-w-md leading-relaxed">
            There are no leads in the system yet. Analytics data will appear once leads are received and processed by the ingestion workflow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Executive Intelligence Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Cross-sectional charts and deep metrics computed dynamically.</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Total Leads</span>
          <h3 className="text-3xl font-bold tracking-tight text-text-primary">{totalLeads.toLocaleString()}</h3>
        </div>
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Average Lead Score</span>
          <div className="flex items-baseline space-x-1">
            <h3 className="text-3xl font-bold tracking-tight text-primary-custom">{averageScore}</h3>
            <span className="text-xs text-text-secondary font-medium">/ 100</span>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Emergency %</span>
          <h3 className="text-3xl font-bold tracking-tight text-danger-custom">{emergencyPercent}%</h3>
        </div>
        <div className="bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary">Conversion Rate</span>
          <h3 className={`text-3xl font-bold tracking-tight ${conversionRate > 0 ? 'text-success-custom' : 'text-text-secondary'}`}>
            {conversionRate}%
          </h3>
        </div>
      </div>

      {/* Monthly Trend + Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-8 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-text-primary">Monthly Lead Trend</h2>
              <p className="text-xs text-text-secondary mt-0.5">Ingested leads aggregated by month.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px' }}
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
        <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-text-primary">Priority Breakdown</h2>
            <p className="text-xs text-text-secondary mt-0.5">Distribution of lead priorities.</p>
          </div>
          {priorityData.length > 0 ? (
            <>
              <div className="h-44 w-full relative flex items-center justify-center my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold tracking-tight">{totalLeads}</span>
                  <span className="text-[10px] text-text-secondary font-medium tracking-wider uppercase">Leads</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {priorityData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-secondary font-medium">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm my-6">No data</div>
          )}
        </div>
      </div>

      {/* Weekly Trend + Emergency Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Trend */}
        <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Weekly Comparison</h2>
            <p className="text-xs text-text-secondary mt-0.5">Current week vs previous week.</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ left: -20 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="leads" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emergency Analysis */}
        <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-text-primary">Emergency Analysis</h2>
            <p className="text-xs text-text-secondary mt-0.5">Emergency vs non-emergency breakdown.</p>
          </div>
          {emergencyData.length > 0 ? (
            <>
              <div className="h-44 w-full relative flex items-center justify-center my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={emergencyData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {emergencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold tracking-tight">{emergencyData.reduce((s, d) => s + d.value, 0)}</span>
                  <span className="text-[10px] text-text-secondary font-medium tracking-wider uppercase">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {emergencyData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-secondary font-medium">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm my-6">No data</div>
          )}
        </div>

        {/* Lead Quality Distribution */}
        <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-text-primary">Lead Quality</h2>
            <p className="text-xs text-text-secondary mt-0.5">AI-qualified lead quality distribution.</p>
          </div>
          {qualityData.length > 0 ? (
            <>
              <div className="h-44 w-full relative flex items-center justify-center my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={qualityData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold tracking-tight">{qualityData.reduce((s, d) => s + d.value, 0)}</span>
                  <span className="text-[10px] text-text-secondary font-medium tracking-wider uppercase">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {qualityData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-secondary font-medium">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm my-6">No data</div>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Conversion Funnel</h2>
            <p className="text-xs text-text-secondary mt-0.5">Current lead counts at each pipeline stage.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {funnelData.map((stage, index) => {
              const maxVal = Math.max(...funnelData.map(s => s.value), 1)
              const widthPct = maxVal > 0 ? Math.max((stage.value / maxVal) * 100, 15) : 15
              return (
                <div key={stage.name} className="flex flex-col items-center w-full sm:w-auto">
                  <div className="flex flex-col items-center">
                    <div
                      className="bg-primary-custom/10 border border-primary-custom/20 rounded-card flex items-center justify-center w-full"
                      style={{ height: `${Math.max(stage.value * 10, 40)}px`, maxHeight: '120px', minWidth: '80px' }}
                    >
                      <span className="text-lg font-bold text-primary-custom">{stage.value}</span>
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-2 text-center">{stage.name}</span>
                  </div>
                  {index < funnelData.length - 1 && (
                    <svg className="hidden sm:block h-5 w-5 text-text-muted mt-2 -mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Service Type Distribution + City Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Service Type */}
        <div className="lg:col-span-6 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Service Type Distribution</h2>
            <p className="text-xs text-text-secondary mt-0.5">Lead volume by requested service category.</p>
          </div>
          <div className="h-64 w-full">
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} margin={{ left: -20 }} layout="vertical">
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-sm">No service data</div>
            )}
          </div>
        </div>

        {/* City Distribution */}
        <div className="lg:col-span-6 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Geographical Heat Distribution</h2>
            <p className="text-xs text-text-secondary mt-0.5">Leads frequency mapped by major cities.</p>
          </div>
          <div className="h-64 w-full">
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} margin={{ left: -20 }} layout="vertical">
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="Count" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-sm">No city data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
