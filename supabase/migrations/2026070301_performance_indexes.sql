-- Performance Indexes Migration
-- Sprint 07: Database Query Performance Optimization
-- Date: 2026-07-03

-- =====================================================================
-- HVAC Leads — most-queried table: filters by created_at, status, priority
-- =====================================================================

-- Composite index for the dashboard's primary query pattern:
-- WHERE status = X AND priority = Y ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_hvac_leads_status_priority_created
    ON public.hvac_leads (status, priority, created_at DESC);

-- Standalone index on created_at for date-range scanning (dashboard, analytics)
CREATE INDEX IF NOT EXISTS idx_hvac_leads_created_at
    ON public.hvac_leads (created_at DESC);

-- Standalone index on priority (priority breakdown charts)
CREATE INDEX IF NOT EXISTS idx_hvac_leads_priority
    ON public.hvac_leads (priority);

-- Index on status (status distribution queries)
CREATE INDEX IF NOT EXISTS idx_hvac_leads_status
    ON public.hvac_leads (status);

-- =====================================================================
-- Lead Events — activity feed queries sorted by created_at
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at
    ON public.lead_events (created_at DESC);

-- =====================================================================
-- Appointments — date-range lookups for scheduling widgets
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_date_status
    ON public.appointments (appointment_date, status);

-- =====================================================================
-- Reminders — pending/overdue lookups
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_reminders_status_date
    ON public.reminders (status, reminder_date);

-- =====================================================================
-- Verify indexes were created
-- =====================================================================
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename IN ('hvac_leads', 'lead_events', 'appointments', 'reminders')
ORDER BY tablename, indexname;
