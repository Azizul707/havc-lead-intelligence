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
          n8n_webhook_url: string | null
          emergency_email_dispatch: boolean | null
          auto_ai_ingestion: boolean | null
          role: string | null
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
          n8n_webhook_url?: string | null
          emergency_email_dispatch?: boolean | null
          auto_ai_ingestion?: boolean | null
          role?: string | null
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
          n8n_webhook_url?: string | null
          emergency_email_dispatch?: boolean | null
          auto_ai_ingestion?: boolean | null
          role?: string | null
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
          source: string | null
          lead_source: string | null
          source_type: string | null
          source_reference: string | null
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
          source?: string | null
          lead_source?: string | null
          source_type?: string | null
          source_reference?: string | null
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
          source?: string | null
          lead_source?: string | null
          source_type?: string | null
          source_reference?: string | null
        }
      }
      lead_events: {
        Row: {
          id: string
          lead_id: string
          event_type: string
          description: string
          metadata: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          event_type: string
          description: string
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          event_type?: string
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
      appointments: {
        Row: {
          id: string
          lead_id: string
          appointment_date: string
          appointment_time: string
          appointment_type: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          appointment_date: string
          appointment_time: string
          appointment_type: string
          status: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_types: {
        Row: {
          id: string
          user_id: string
          name: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          lead_id: string
          reminder_date: string
          reminder_time: string
          priority: string
          message: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          reminder_date: string
          reminder_time: string
          priority: string
          message: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          reminder_date?: string
          reminder_time?: string
          priority?: string
          message?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
