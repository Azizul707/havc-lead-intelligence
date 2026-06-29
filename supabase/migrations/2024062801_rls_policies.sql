-- RLS Policies for HVAC AI Operations Platform
-- Sprint 05: Production Security Hardening

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hvac_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Table Policies
-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. HVAC Leads Table Policies
-- Users can view all leads (company-wide visibility)
CREATE POLICY "Users can view all leads" ON public.hvac_leads
    FOR SELECT USING (true);

-- Users can create new leads
CREATE POLICY "Users can create leads" ON public.hvac_leads
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update leads they own
CREATE POLICY "Users can update own leads" ON public.hvac_leads
    FOR UPDATE USING (auth.uid() = owner_id);

-- 3. Lead Events Table Policies
-- Users can view all events for leads they can see
CREATE POLICY "Users can view lead events" ON public.lead_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = lead_events.lead_id
        )
    );

-- Users can create events for leads they can see
CREATE POLICY "Users can create lead events" ON public.lead_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = lead_events.lead_id
        )
    );

-- 4. Lead Notes Table Policies
-- Users can view all notes for leads they can see
CREATE POLICY "Users can view lead notes" ON public.lead_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = lead_notes.lead_id
        )
    );

-- Users can create notes for leads they can see
CREATE POLICY "Users can create lead notes" ON public.lead_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own notes
CREATE POLICY "Users can update own notes" ON public.lead_notes
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON public.lead_notes
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Appointments Table Policies
-- Users can view all appointments for leads they can see
CREATE POLICY "Users can view appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = appointments.lead_id
        )
    );

-- Users can create appointments for leads they can see
CREATE POLICY "Users can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = appointments.lead_id
        )
    );

-- Users can update appointments
CREATE POLICY "Users can update appointments" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = appointments.lead_id
        )
    );

-- 6. Reminders Table Policies
-- Users can view all reminders for leads they can see
CREATE POLICY "Users can view reminders" ON public.reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = reminders.lead_id
        )
    );

-- Users can create reminders for leads they can see
CREATE POLICY "Users can create reminders" ON public.reminders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = reminders.lead_id
        )
    );

-- Users can update reminders
CREATE POLICY "Users can update reminders" ON public.reminders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.hvac_leads 
            WHERE hvac_leads.id = reminders.lead_id
        )
    );

-- Create indexes for performance
CREATE INDEX idx_hvac_leads_owner_id ON public.hvac_leads(owner_id);
CREATE INDEX idx_hvac_leads_status ON public.hvac_leads(status);
CREATE INDEX idx_hvac_leads_priority ON public.hvac_leads(priority);
CREATE INDEX idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX idx_reminders_lead_id ON public.reminders(lead_id);

-- Add audit trigger for lead updates
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO public.lead_events (lead_id, event_type, description, created_by)
        VALUES (
            NEW.id,
            'STATUS_CHANGED',
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_lead_status_change
    AFTER UPDATE OF status ON public.hvac_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.log_lead_status_change();

-- Comment: This migration should be run in Supabase SQL Editor
-- to enable proper security for production deployment