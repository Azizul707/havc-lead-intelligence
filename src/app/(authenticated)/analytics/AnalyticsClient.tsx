'use client'

import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

interface Lead {
  id: string
  created_at: string
  city: string
  service_type: string
  priority: string
  lead_score: number
  urgency: string
  status: string
}

export default function AnalyticsClient({ leads }: { leads: Lead[] }) {
  
  // ১. ডেইলী লিড ট্রেন্ড ডেটা (শেষ ৭ দিন)
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toLocaleDateString('en-US', { weekday: 'short' })
    }).reverse()

    return days.map(day => {
      const count = leads.filter(l => new Date(l.created_at).toLocaleDateString('en-US', { weekday: 'short' }) === day).length
      return { name: day, Leads: count }
    })
  }, [leads])

  // ২. সিটিস ডিস্ট্রিবিউশন ডেটা
  const cityData = useMemo(() => {
    const cities = Array.from(new Set(leads.map(l => l.city)))
    return cities.map(city => {
      const count = leads.filter(l => l.city === city).length
      return { name: city, Count: count }
    })
  }, [leads])

  // ৩. প্রায়োরিটি ব্রেকডাউন ডেটা
  const priorityData = useMemo(() => {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const colors = ['#9CA3AF', '#2563EB', '#F59E0B', '#EF4444']
    return priorities.map((p, idx) => {
      const count = leads.filter(l => l.priority === p).length
      return { name: p, value: count, color: colors[idx] }
    }).filter(p => p.value > 0)
  }, [leads])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Executive Intelligence Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Cross-sectional charts and deep metrics computed dynamically.</p>
      </div>

      {/* Grid: 12 Columns, matching DESIGN.md gap 24px */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Trend Area Chart (8 Columns) */}
        <div className="lg:col-span-8 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-text-primary">Inbound Response Velocity</h2>
              <p className="text-xs text-text-secondary mt-0.5">Ingested leads frequency metric.</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <XAxis dataKey="name" fontSize={11} stroke="#6B7280" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#6B7280" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E5E7EB' }} />
                <Area type="monotone" dataKey="Leads" stroke="#2563EB" strokeWidth={2} fillOpacity={0.05} fill="#2563EB" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown (4 Columns) */}
        <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-text-primary">Severity Breakdown</h2>
            <p className="text-xs text-text-secondary mt-0.5">Urgency distribution breakdown.</p>
          </div>
          
          <div className="h-44 w-full flex items-center justify-center my-4 relative">
            {priorityData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={65} paddingAngle={4} dataKey="value">
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center flex flex-col">
                  <span className="text-2xl font-bold">{leads.length}</span>
                  <span className="text-[10px] text-text-secondary font-semibold uppercase">Total</span>
                </div>
              </>
            ) : (
              <span className="text-sm text-text-secondary">No data</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {priorityData.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* City Distribution Bar Chart (12 Columns) */}
        <div className="lg:col-span-12 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold tracking-tight text-text-primary">Geographical Heat Distribution</h2>
            <p className="text-xs text-text-secondary mt-0.5">Leads frequency mapped by major cities.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ left: -20 }}>
                <XAxis dataKey="name" fontSize={11} stroke="#6B7280" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#6B7280" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E5E7EB' }} />
                <Bar dataKey="Count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}