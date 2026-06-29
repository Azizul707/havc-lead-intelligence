-- =============================================================================
-- HVAC AI Lead Intelligence Platform - Safe Database Reset Script
-- Version: 1.1.0
-- Purpose: Removes demo data while preserving all schema, indexes, and RLS.
-- Use this to reset the database for re-seeding or production go-live.
-- =============================================================================

-- Safely clear dependent tables in order (child tables first to avoid FK violations)
truncate table public.lead_notes cascade;
truncate table public.lead_events cascade;
truncate table public.appointments cascade;
truncate table public.reminders cascade;
truncate table public.hvac_leads cascade;
truncate table public.profiles cascade;

-- Confirm reset is complete
select 'Database reset complete. All demo data removed, schema preserved.' as status;
select count(*) as remaining_leads from public.hvac_leads;
select count(*) as remaining_appointments from public.appointments;
select count(*) as remaining_reminders from public.reminders;
