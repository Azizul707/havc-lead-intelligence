/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import LeadsClient from './LeadsClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const PAGE_SIZE = 25

export default async function LeadsPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(100, Math.max(10, Number(params.pageSize) || PAGE_SIZE))
  const search = (params.search as string) || ''
  const priorityFilter = (params.priority as string) || 'all'
  const cityFilter = (params.city as string) || 'all'
  const sourceFilter = (params.source as string) || 'all'
  const serviceFilter = (params.service as string) || 'all'
  const sortOrder = (params.sort as string) || 'newest'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build base query
  let query = (supabase.from('hvac_leads') as any)
    .select('*', { count: 'exact' })
    .or(`owner_id.eq.${user.id},owner_id.is.null`)

  // Apply server-side filters
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%,service_type.ilike.%${search}%`
    )
  }
  if (priorityFilter !== 'all') {
    query = query.eq('priority', priorityFilter)
  }
  if (cityFilter !== 'all') {
    query = query.eq('city', cityFilter)
  }
  if (sourceFilter !== 'all') {
    query = query.eq('source', sourceFilter)
  }
  if (serviceFilter !== 'all') {
    query = query.eq('service_type', serviceFilter)
  }

  // Apply sorting
  switch (sortOrder) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'score-desc':
      query = query.order('lead_score', { ascending: false })
      break
    case 'score-asc':
      query = query.order('lead_score', { ascending: true })
      break
    case 'priority': {
      // Custom priority ordering can't be expressed in Supabase query easily
      // Fall through to default order but we'll sort on client side
      query = query.order('created_at', { ascending: false })
      break
    }
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  query = query.range(from, to)

  const { data: leads, error, count } = await query

  if (error) {
    console.error('Error fetching leads:', error)
  }

  const safeLeads = (leads || []).map((lead: any) => ({
    ...lead,
    lead_score: Number(lead.lead_score || 0)
  }))

  // Get unique filter values for dropdowns
  const { data: filterData } = await (supabase.from('hvac_leads') as any)
    .select('city, source, service_type')
    .or(`owner_id.eq.${user.id},owner_id.is.null`)

  const uniqueCities = [...new Set((filterData || []).map((l: any) => l.city).filter(Boolean))] as string[]
  const uniqueSources = [...new Set((filterData || []).map((l: any) => l.source).filter(Boolean))] as string[]
  const uniqueServices = [...new Set((filterData || []).map((l: any) => l.service_type).filter(Boolean))] as string[]

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <LeadsClient
      initialLeads={safeLeads as any}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      totalPages={totalPages}
      initialSearch={search}
      initialPriority={priorityFilter}
      initialCity={cityFilter}
      initialSource={sourceFilter}
      initialService={serviceFilter}
      initialSort={sortOrder}
      uniqueCities={uniqueCities}
      uniqueSources={uniqueSources}
      uniqueServices={uniqueServices}
      sortOrder={sortOrder}
    />
  )
}
