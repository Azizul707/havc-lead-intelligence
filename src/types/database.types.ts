export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          company_name: string | null
          phone: string | null
          timezone: string | null
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          timezone?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          timezone?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hvac_leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          owner_id: string
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
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          owner_id: string
          customer_name: string
          phone: string
          email?: string | null
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
          status?: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'LOST'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          owner_id?: string
          customer_name?: string
          phone?: string
          email?: string | null
          city?: string
          service_type?: string
          property_type?: string
          issue_description?: string
          lead_quality?: 'LOW' | 'MEDIUM' | 'HIGH'
          urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'
          estimated_job_value?: 'LOW' | 'MEDIUM' | 'HIGH'
          customer_intent?: 'UNKNOWN' | 'SHOPPING' | 'READY_TO_BUY'
          recommended_response_time?: string
          service_category?: string
          summary?: string
          recommended_action?: string
          lead_score?: number
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          status?: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'LOST'
        }
      }
      lead_events: {
        Row: {
          id: string
          lead_id: string
          event_type: 'LEAD_CREATED' | 'AI_ANALYZED' | 'EMAIL_SENT' | 'SMS_SENT' | 'CUSTOMER_CONTACTED' | 'JOB_SCHEDULED' | 'JOB_COMPLETED' | 'STATUS_CHANGED' | 'NOTE_ADDED'
          description: string
          metadata: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          event_type: 'LEAD_CREATED' | 'AI_ANALYZED' | 'EMAIL_SENT' | 'SMS_SENT' | 'CUSTOMER_CONTACTED' | 'JOB_SCHEDULED' | 'JOB_COMPLETED' | 'STATUS_CHANGED' | 'NOTE_ADDED'
          description: string
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          event_type?: 'LEAD_CREATED' | 'AI_ANALYZED' | 'EMAIL_SENT' | 'SMS_SENT' | 'CUSTOMER_CONTACTED' | 'JOB_SCHEDULED' | 'JOB_COMPLETED' | 'STATUS_CHANGED' | 'NOTE_ADDED'
          description?: string
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          user_id: string
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          user_id: string
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          user_id?: string
          note?: string
          created_at?: string
        }
      }
    }
  }
}