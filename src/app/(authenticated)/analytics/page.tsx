/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: leads, error } = await (supabase.from('hvac_leads') as any)
    .select('*')
    .or(`owner_id.eq.${user.id},owner_id.is.null`)

  if (error) {
    console.error('Error fetching leads for analytics:', error)
  }

  const safeLeads = (leads || []).map((lead: any) => ({
    ...lead,
    lead_score: Number(lead.lead_score || 0)
  }))

  const totalLeads = safeLeads.length

  // Average Lead Score
  const totalScore = safeLeads.reduce((sum: number, l: any) => sum + l.lead_score, 0)
  const averageScore = totalLeads > 0 ? Math.round(totalScore / totalLeads) : 0

  // Emergency Leads %
  const emergencyCount = safeLeads.filter((l: any) => l.urgency === 'EMERGENCY').length
  const emergencyPercent = totalLeads > 0 ? Math.round((emergencyCount / totalLeads) * 100) : 0

  // Conversion Rate
  const completedCount = safeLeads.filter((l: any) => l.status === 'COMPLETED').length
  const conversionRate = totalLeads > 0 ? Math.round((completedCount / totalLeads) * 100) : 0

  // Service Type Distribution
  const serviceMap: Record<string, number> = {}
  safeLeads.forEach((l: any) => {
    const key = l.service_type || 'Unknown'
    serviceMap[key] = (serviceMap[key] || 0) + 1
  })
  const serviceData = Object.entries(serviceMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Lead Quality Distribution
  const qualityColors: Record<string, string> = {
    HIGH: '#2563EB',
    MEDIUM: '#F59E0B',
    LOW: '#9CA3AF'
  }
  const qualityMap: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  safeLeads.forEach((l: any) => {
    const q = l.lead_quality || 'MEDIUM'
    qualityMap[q] = (qualityMap[q] || 0) + 1
  })
  const qualityData = Object.entries(qualityMap)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value, color: qualityColors[name] || '#9CA3AF' }))

  // Monthly Lead Trend
  const monthMap: Record<string, number> = {}
  safeLeads.forEach((l: any) => {
    const d = new Date(l.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = (monthMap[key] || 0) + 1
  })
  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, leads]) => {
      const [y, m] = month.split('-')
      const d = new Date(Number(y), Number(m) - 1)
      return { month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), leads }
    })

  // Weekly Trend (current week vs previous week)
  const now = new Date()
  const currentWeekStart = new Date(now)
  currentWeekStart.setDate(now.getDate() - now.getDay())
  currentWeekStart.setHours(0, 0, 0, 0)
  const prevWeekStart = new Date(currentWeekStart)
  prevWeekStart.setDate(currentWeekStart.getDate() - 7)
  const prevWeekEnd = new Date(currentWeekStart)
  prevWeekEnd.setMilliseconds(-1)

  let currentWeekCount = 0
  let previousWeekCount = 0
  safeLeads.forEach((l: any) => {
    const created = new Date(l.created_at)
    if (created >= currentWeekStart) {
      currentWeekCount++
    } else if (created >= prevWeekStart && created < currentWeekStart) {
      previousWeekCount++
    }
  })
  const weeklyData = [
    { name: 'Previous Week', leads: previousWeekCount },
    { name: 'Current Week', leads: currentWeekCount }
  ]

  // Emergency vs Non-Emergency
  const nonEmergencyCount = totalLeads - emergencyCount
  const emergencyData = [
    { name: 'Emergency', value: emergencyCount, color: '#EF4444' },
    { name: 'Non-Emergency', value: nonEmergencyCount, color: '#9CA3AF' }
  ].filter(d => d.value > 0)

  // Conversion Funnel
  const funnelStatuses = ['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED']
  const funnelData = funnelStatuses.map(status => {
    const count = safeLeads.filter((l: any) => l.status === status).length
    return { name: status, value: count }
  })

  return (
    <AnalyticsClient
      leads={safeLeads as any}
      totalLeads={totalLeads}
      averageScore={averageScore}
      emergencyPercent={emergencyPercent}
      conversionRate={conversionRate}
      serviceData={serviceData}
      qualityData={qualityData}
      monthlyData={monthlyData}
      weeklyData={weeklyData}
      emergencyData={emergencyData}
      funnelData={funnelData}
    />
  )
}
