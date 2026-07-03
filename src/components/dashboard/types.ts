// Shared data interfaces for dashboard components

export interface Lead {
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
  source: string
}

export interface LeadEvent {
  id: string
  lead_id: string
  event_type: string
  description: string
  created_at: string
  hvac_leads?: { customer_name: string }
}

export interface Appointment {
  id: string
  lead_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: string
  status: string
  notes: string | null
}

export interface Reminder {
  id: string
  lead_id: string
  reminder_date: string
  reminder_time: string
  priority: string
  message: string
  status: string
}

// Minimal contact snapshot used by the schedule widget (avoids
// importing the full Lead interface in a child component)
export interface LeadContact {
  id: string
  customer_name: string
  service_type: string
  priority: string
  city: string
}

// KPI metrics interface for the dashboard cards
export interface KPIMetric {
  todayApps: number
  pendingReminders: number
  overdueReminders: number
  scheduledJobs: number
}
