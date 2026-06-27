/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useMemo } from 'react'
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Percent, 
  Calendar,
  X,
  Phone,
  Mail,
  MapPin,
  Clock3,
  Sparkles,
  ArrowRight,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react'
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
import { triggerLeadAction } from '../../app/(authenticated)/dashboard/actions'

interface Lead {
  id: string
  created_at: string
  customer_name: string
  phone: string
  email: string | null
  city: string
  service_type: string
  property_type: string
  issue_description: string
  lead_quality: 'LOW' | 'MEDIUM' | 'HIGH'
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'
  estimated_job_value: 'LOW' | 'MEDIUM' | 'HIGH'
  customer_intent: 'UNKNOWN' | 'SHOPPING' | 'READY_TO_BUY'
  recommended_response_time: string
  service_category: string
  summary: string
  recommended_action: string
  lead_score: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'LOST'
}

interface DashboardClientProps {
  initialLeads: Lead[]
}

export default function DashboardClient({ initialLeads }: DashboardClientProps) {
  // Core States
  const [leads] = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  
  // CRM V2 Actions States
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  
  // Filters State
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // ১. ডাইনামিক ফিল্টারিং লজিক (সব ফিল্টার একসাথে কাজ করবে)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Time Range Filter
      if (timeFilter !== 'all') {
        const leadDate = new Date(lead.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - leadDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (timeFilter === 'today') {
          const isToday = leadDate.toDateString() === now.toDateString()
          if (!isToday) return false
        } else if (timeFilter === '7days' && diffDays > 7) {
          return false
        } else if (timeFilter === '30days' && diffDays > 30) {
          return false
        }
      }

      // Priority Filter
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false
      // City Filter
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false
      // Status Filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false

      return true
    })
  }, [leads, timeFilter, priorityFilter, cityFilter, statusFilter])

  // ২. ইউনিক সিটিস লিষ্ট (ফিল্টারের জন্য ড্রপডাউন তৈরি করতে)
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(leads.map(l => l.city)))
  }, [leads])

  // ৩. KPI মেট্রিics ক্যালকুলেশন (ফিল্টার অনুযায়ী ডাইনামিকালি আপডেট হবে)
  const metrics = useMemo(() => {
    const total = filteredLeads.length
    const today = leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length
    const emergency = filteredLeads.filter(l => l.urgency === 'EMERGENCY' || l.priority === 'CRITICAL').length
    
    const sumScore = filteredLeads.reduce((acc, curr) => acc + curr.lead_score, 0)
    const avgScore = total > 0 ? Math.round(sumScore / total) : 0

    return { total, today, emergency, avgScore }
  }, [filteredLeads, leads])

  // ৪. Recharts-এর জন্য ডেইলী লিড ট্রেন্ড ডেটা জেনারেট করা
  const leadTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }).reverse()

    const counts = last7Days.map(dayStr => {
      const count = filteredLeads.filter(lead => {
        const leadDayStr = new Date(lead.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        return leadDayStr === dayStr
      }).length
      return { day: dayStr.split(',')[0], Leads: count }
    })

    return counts
  }, [filteredLeads])

  // ৫. Recharts-এর জন্য প্রায়োরিটি ডিস্ট্রিবিউশন ডেটা জেনারেট করা
  const priorityChartData = useMemo(() => {
    const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const colors = ['#9CA3AF', '#2563EB', '#F59E0B', '#EF4444'] // LOW, MEDIUM, HIGH, CRITICAL

    return priorities.map((p, idx) => {
      const count = filteredLeads.filter(l => l.priority === p).length
      return { name: p, value: count, color: colors[idx] }
    }).filter(p => p.value > 0)
  }, [filteredLeads])

  // ৬. প্রায়োরিটি এবং স্ট্যাটাস ব্যাজ কালার কনফিগারেশন (ডিজাইন স্পেক অনুযায়ী)
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-danger-custom/10 text-danger-custom border-danger-custom/20'
      case 'HIGH': return 'bg-warning-custom/10 text-warning-custom border-warning-custom/20'
      case 'MEDIUM': return 'bg-primary-custom/10 text-primary-custom border-primary-custom/20'
      default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-primary-custom/10 text-primary-custom'
      case 'CONTACTED': return 'bg-warning-custom/10 text-warning-custom'
      case 'SCHEDULED': return 'bg-info-custom/10 text-info-custom'
      case 'COMPLETED': return 'bg-success-custom/10 text-success-custom'
      default: return 'bg-text-secondary/10 text-text-secondary'
    }
  }

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsPanelOpen(true)
    setFeedbackMsg(null)
  }

  // CRM V2 অ্যাকশন ট্রিগার হ্যান্ডলার
  const handleAction = async (actionType: 'call' | 'email' | 'contact' | 'schedule' | 'complete') => {
    if (!selectedLead) return
    setActionLoading(actionType)
    setFeedbackMsg(null)

    try {
      const res = await triggerLeadAction(selectedLead.id, actionType)
      if (res.success) {
        if (res.newStatus) {
          setSelectedLead(prev => prev ? { ...prev, status: res.newStatus as any } : null)
        }
        setFeedbackMsg(`Action "${actionType.toUpperCase()}" successfully triggered and logged in CRM.`)
      } else {
        setFeedbackMsg(`Error: ${res.error}`)
      }
    } catch {
      setFeedbackMsg('An unexpected error occurred executing the action.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-8 relative">
      
      {/* Filters Row - Minimal & Elegant layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border-custom">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">HVAC Lead Command Center</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time artificial intelligence qualification and routing engine.</p>
        </div>
        
        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value as 'all' | 'today' | '7days' | '30days')}
            className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today Only</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>

          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select 
            value={cityFilter} 
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-border-custom rounded-input text-sm font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        
        {/* KPI 1: Today's Leads */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Today&apos;s Leads</span>
            <Calendar className="h-5 w-5 text-primary-custom" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{metrics.today}</h3>
            <p className="text-xs text-text-secondary mt-1">Direct ingestions</p>
          </div>
        </div>

        {/* KPI 2: Total Leads */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Total Leads</span>
            <Activity className="h-5 w-5 text-info-custom" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{metrics.total}</h3>
            <p className="text-xs text-text-secondary mt-1">Filtered result</p>
          </div>
        </div>

        {/* KPI 3: Emergency Leads */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Emergency</span>
            <AlertTriangle className="h-5 w-5 text-danger-custom animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{metrics.emergency}</h3>
            <p className="text-xs text-text-secondary mt-1">Needs action</p>
          </div>
        </div>

        {/* KPI 4: Average Score */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Avg Lead Score</span>
            <TrendingUp className="h-5 w-5 text-success-custom" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{metrics.avgScore}/100</h3>
            <p className="text-xs text-text-secondary mt-1">AI calculated</p>
          </div>
        </div>

        {/* KPI 5: Conversion Rate */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between opacity-80 h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Conversion</span>
            <Percent className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">84%</h3>
            <p className="text-xs text-text-secondary mt-1">Future module</p>
          </div>
        </div>

        {/* KPI 6: Response Time */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-card border border-border-custom shadow-sm flex flex-col justify-between opacity-80 h-36">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Response Time</span>
            <Clock className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">14m</h3>
            <p className="text-xs text-text-secondary mt-1">Future module</p>
          </div>
        </div>

      </div>

      {/* Second Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lead Trend Area Chart */}
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

        {/* Priority Distribution Pie Chart */}
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
                <span className="text-2xl font-bold tracking-tight">{filteredLeads.length}</span>
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
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Third Row: Recent Leads Table */}
      <div className="bg-surface rounded-card border border-border-custom shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border-custom flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-text-primary">Recent Qualified Leads</h2>
            <p className="text-xs text-text-secondary mt-0.5">Click on any row to open the intelligence drawer.</p>
          </div>
          <span className="text-xs font-semibold bg-primary-custom/10 text-primary-custom px-2.5 py-1 rounded-full">
            {filteredLeads.length} leads found
          </span>
        </div>

        {/* Lead Table */}
        <div className="overflow-x-auto">
          {filteredLeads.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Lead Score</th>
                  <th className="px-6 py-4">Urgency</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom text-sm">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => handleRowClick(lead)}
                    className="hover:bg-background/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-semibold text-text-primary group-hover:text-primary-custom transition-colors">
                      {lead.customer_name}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{lead.phone}</td>
                    <td className="px-6 py-4 text-text-secondary">{lead.city}</td>
                    <td className="px-6 py-4 text-text-secondary truncate max-w-32">{lead.service_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={lead.lead_score >= 80 ? 'text-success-custom' : lead.lead_score >= 50 ? 'text-warning-custom' : 'text-text-secondary'}>
                        {lead.lead_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary capitalize">{lead.urgency.toLowerCase()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-text-secondary text-xs">
                      {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-text-secondary flex flex-col items-center justify-center space-y-2">
              <span className="text-base font-semibold">No Leads Found</span>
              <span className="text-xs">Adjust your dropdown filters to display leads.</span>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Intelligence Panel Drawer */}
      {isPanelOpen && selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity duration-200" 
            onClick={() => setIsPanelOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-surface h-full shadow-2xl border-l border-border-custom flex flex-col animate-slide-in">
            
            <div className="px-6 py-5 border-b border-border-custom flex items-center justify-between bg-background/50">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary-custom" />
                <h3 className="text-base font-bold tracking-tight">AI Lead Qualification</h3>
              </div>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="p-1.5 rounded-button hover:bg-border-custom text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              
              <div className="md:col-span-7 space-y-6">
                
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Customer Details</h4>
                  <div className="bg-background p-4 rounded-card border border-border-custom space-y-3">
                    <div className="text-base font-bold text-text-primary">{selectedLead.customer_name}</div>
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{selectedLead.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{selectedLead.city}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Reported Issue</h4>
                  <div className="bg-background p-4 rounded-card border border-border-custom text-sm text-text-primary leading-relaxed">
                    {selectedLead.issue_description}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4 text-primary-custom" />
                    <span>AI Lead Intelligence Summary</span>
                  </h4>
                  <div className="bg-primary-custom/5 border border-primary-custom/15 p-5 rounded-card text-sm text-text-primary leading-relaxed">
                    {selectedLead.summary}
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 space-y-6">
                
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Intelligence Metrics</h4>
                  
                  <div className="bg-background border border-border-custom p-4 rounded-card flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-text-secondary">Lead Score</div>
                      <div className="text-3xl font-bold tracking-tight text-primary-custom">{selectedLead.lead_score}/100</div>
                    </div>
                    <span className="text-xs font-semibold bg-primary-custom/10 text-primary-custom px-2.5 py-1 rounded-full">
                      {selectedLead.lead_quality} QUALITY
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background border border-border-custom p-3 rounded-card text-center">
                      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Priority</div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(selectedLead.priority)}`}>
                        {selectedLead.priority}
                      </span>
                    </div>
                    <div className="bg-background border border-border-custom p-3 rounded-card text-center">
                      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Urgency</div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-background border border-border-custom capitalize text-text-primary">
                        {selectedLead.urgency.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Recommended Routing</h4>
                  
                  <div className="bg-background border border-border-custom p-4 rounded-card space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs text-text-secondary font-semibold">
                      <Clock3 className="h-4 w-4" />
                      <span>RECOMMENDED RESPONSE</span>
                    </div>
                    <p className="text-sm font-bold text-text-primary">{selectedLead.recommended_response_time}</p>
                  </div>

                  <div className="bg-background border border-border-custom p-4 rounded-card space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs text-text-secondary font-semibold">
                      <ArrowRight className="h-4 w-4" />
                      <span>NEXT LOGICAL ACTION</span>
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-relaxed">{selectedLead.recommended_action}</p>
                  </div>
                </div>

                {/* V2: Quick CRM Action Buttons */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Quick CRM Actions</h4>
                  
                  {feedbackMsg && (
                    <div className="p-3 bg-primary-custom/5 text-primary-custom text-xs font-semibold rounded-input border border-primary-custom/10">
                      {feedbackMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      onClick={() => handleAction('call')}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-button text-sm font-semibold transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                    >
                      <span className="flex items-center space-x-2.5">
                        <Phone className="h-4 w-4 text-primary-custom" />
                        <span>Call Customer</span>
                      </span>
                      {actionLoading === 'call' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary-custom" />
                      ) : (
                        <span className="text-[10px] text-text-secondary">Webhook</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction('email')}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-button text-sm font-semibold transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                    >
                      <span className="flex items-center space-x-2.5">
                        <Mail className="h-4 w-4 text-primary-custom" />
                        <span>Email Customer</span>
                      </span>
                      {actionLoading === 'email' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary-custom" />
                      ) : (
                        <span className="text-[10px] text-text-secondary">Webhook</span>
                      )}
                    </button>

                    {selectedLead.status === 'NEW' && (
                      <button
                        onClick={() => handleAction('contact')}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-button text-sm font-semibold transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                      >
                        <span className="flex items-center space-x-2.5">
                          <UserCheck className="h-4 w-4 text-warning-custom" />
                          <span>Mark Contacted</span>
                        </span>
                        {actionLoading === 'contact' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-warning-custom" />
                        ) : (
                          <span className="text-[10px] text-text-secondary">CRM State</span>
                        )}
                      </button>
                    )}

                    {(selectedLead.status === 'NEW' || selectedLead.status === 'CONTACTED') && (
                      <button
                        onClick={() => handleAction('schedule')}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-background hover:bg-border-custom border border-border-custom rounded-button text-sm font-semibold transition-colors text-text-primary disabled:opacity-50 cursor-pointer"
                      >
                        <span className="flex items-center space-x-2.5">
                          <CalendarCheck className="h-4 w-4 text-info-custom" />
                          <span>Schedule Visit</span>
                        </span>
                        {actionLoading === 'schedule' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-info-custom" />
                        ) : (
                          <span className="text-[10px] text-text-secondary">CRM State</span>
                        )}
                      </button>
                    )}

                    {selectedLead.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleAction('complete')}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-success-custom/10 border border-success-custom/25 rounded-button text-sm font-bold text-success-custom hover:bg-success-custom/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <span className="flex items-center space-x-2.5">
                          <CheckCircle2 className="h-4 w-4 text-success-custom" />
                          <span>Complete Job</span>
                        </span>
                        {actionLoading === 'complete' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-success-custom" />
                        ) : (
                          <span className="text-[10px] text-success-custom">CRM State</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
              </div>

            </div>

            <div className="p-6 border-t border-border-custom bg-background/50 flex items-center justify-between">
              <div className="text-xs text-text-secondary font-medium">
                Lead ID: <span className="font-semibold">{selectedLead.id.substring(0, 8)}...</span>
              </div>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="px-4 py-2 border border-border-custom hover:bg-border-custom text-sm font-semibold rounded-button transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}