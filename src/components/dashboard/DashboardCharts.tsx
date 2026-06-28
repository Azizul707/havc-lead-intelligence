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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Lead Trend Area Chart (8 Columns) */}
      <div className="lg:col-span-8 bg-surface p-6 rounded-card border border-border-custom shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold tracking-tight text-text-primary">Lead Traffic Trend</h2>
            <p className="text-xs text-text-secondary mt-0.5">Ingested leads over the last 7 calendar days.</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={leadTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" />
              <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px' }} 
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
      <div className="lg:col-span-4 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-text-primary">Priority Breakdown</h2>
          <p className="text-xs text-text-secondary mt-0.5">Distribution of lead priorities in selection.</p>
        </div>
        
        {priorityChartData.length > 0 ? (
          <div className="h-44 w-full relative flex items-center justify-center my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold tracking-tight">{filteredLeadsLength}</span>
              <span className="text-[10px] text-text-secondary font-medium tracking-wider uppercase">Leads</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm my-6">
            No data available
          </div>
        )}

        {/* Color Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {priorityChartData.map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-text-secondary font-medium">{item.name} ({item.value})</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}