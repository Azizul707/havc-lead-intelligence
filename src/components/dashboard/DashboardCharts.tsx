/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'

interface DashboardChartsProps {
  leadTrendData: any[]
  priorityChartData: any[]
  filteredLeadsLength: number
}

/**
 * Extracted charts component to isolate heavy visualization libraries from the initial main bundle.
 * Fully optimized for bundle tree-shaking and dynamic suspense streaming.
 */
export default function DashboardCharts({ 
  leadTrendData, 
  priorityChartData, 
  filteredLeadsLength 
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

      {/* Lead Trend Area Chart (8 Columns) */}
      <div className="lg:col-span-8 bg-surface rounded-card border border-border-custom shadow-sm card-hover">
        <div className="px-5 py-4 border-b border-border-custom">
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">Lead Trend</h2>
          <p className="text-xs text-text-secondary/70 mt-0.5">Ingested leads over the last 7 days.</p>
        </div>
        <div className="p-5 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={leadTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" />
              <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                labelClassName="font-semibold text-text-primary"
              />
              <Area type="monotone" dataKey="Leads" stroke="#2563EB" strokeWidth={2} fillOpacity={0.06} fill="url(#colorLeads)" />
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Distribution Pie Chart (4 Columns) */}
      <div className="lg:col-span-4 bg-surface rounded-card border border-border-custom shadow-sm card-hover flex flex-col">
        <div className="px-5 py-4 border-b border-border-custom">
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">Priority Breakdown</h2>
          <p className="text-xs text-text-secondary/70 mt-0.5">Lead priority distribution.</p>
        </div>

        {priorityChartData.length > 0 ? (
          <div className="flex-1 p-5 flex flex-col items-center justify-center gap-3">
            <div className="h-40 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute flex flex-col items-center leading-none">
                <span className="text-xl font-bold tracking-tight text-text-primary">{filteredLeadsLength}</span>
                <span className="text-[10px] font-medium text-text-muted/80 tracking-wider uppercase mt-0.5">Leads</span>
              </div>
            </div>

            {/* Color Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full max-w-[180px]">
              {priorityChartData.map((item) => (
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
  )
}