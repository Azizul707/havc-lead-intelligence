-- =============================================================================
-- AI Lead Scoring CRM - Realtime Publication
-- Version: 1.1.0
-- Part 3: Supabase Realtime
-- =============================================================================

do $$
begin
  alter publication supabase_realtime add table public.hvac_leads;
  alter publication supabase_realtime add table public.lead_events;
  alter publication supabase_realtime add table public.appointments;
  alter publication supabase_realtime add table public.reminders;
exception when others then
  -- Table may already be in publication
end;
$$;
