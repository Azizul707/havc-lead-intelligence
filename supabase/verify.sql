-- =============================================================================
-- HVAC AI Lead Intelligence Platform - Database Verification Script
-- Version: 1.1.0
-- Purpose: Validate that the database installation completed successfully.
-- Run this after install.sql to confirm everything is in order.
-- =============================================================================

-- 1. Verify all required tables exist
select
    table_name,
    row_security as rls_enabled
from pg_tables
where schemaname = 'public'
  and table_name in ('profiles', 'hvac_leads', 'lead_events', 'lead_notes', 'appointments', 'reminders', 'schema_versions')
order by table_name;

-- 2. Verify schema version
select *
from public.schema_versions
order by installed_at desc
limit 1;

-- 3. Verify indexes exist
select
    indexname,
    indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('hvac_leads', 'lead_events', 'lead_notes', 'appointments', 'reminders')
order by tablename, indexname;

-- 4. Verify RLS is enabled on all tables
select
    relname as table_name,
    relrowsecurity as rls_enabled
from pg_class
where relname in ('profiles', 'hvac_leads', 'lead_events', 'lead_notes', 'appointments', 'reminders')
  and relnamespace = (select oid from pg_namespace where nspname = 'public')
order by relname;

-- 5. Verify RLS policies exist
select
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 6. Verify required functions exist
select
    routine_name,
    routine_type,
    language
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('handle_updated_at', 'log_lead_creation_event', 'log_lead_status_change')
order by routine_name;

-- 7. Verify triggers exist
select
    trigger_name,
    event_manipulation,
    event_object_table
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- 8. Verify seed data (if seeded)
select 'Lead counts by status:' as report;
select status, count(*) as count
from public.hvac_leads
group by status
order by status;

select 'Total appointments:' as report;
select count(*) as total from public.appointments;

select 'Total reminders:' as report;
select count(*) as total from public.reminders;

-- 9. Verify realtime publication
select
    schemaname,
    tablename,
    publicationname
from pg_publication_tables
where publicationname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;

-- ===========================================================================
-- VERIFICATION SUMMARY
-- ===========================================================================
select 'VERIFICATION COMPLETE' as result;
