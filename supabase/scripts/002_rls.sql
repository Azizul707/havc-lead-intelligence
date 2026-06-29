-- =============================================================================
-- HVAC AI Lead Intelligence Platform - RLS Policies
-- Version: 1.1.0
-- Part 2: Row Level Security
-- =============================================================================

-- 1. Enable RLS on all tables
alter table if exists public.profiles enable row level security;
alter table if exists public.hvac_leads enable row level security;
alter table if exists public.lead_events enable row level security;
alter table if exists public.lead_notes enable row level security;
alter table if exists public.appointments enable row level security;
alter table if exists public.reminders enable row level security;

-- 2. Profiles Table Policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own profile' and tablename = 'profiles') then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own profile' and tablename = 'profiles') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own profile' and tablename = 'profiles') then
    create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- 3. HVAC Leads Table Policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view all leads' and tablename = 'hvac_leads') then
    create policy "Users can view all leads" on public.hvac_leads for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can create leads' and tablename = 'hvac_leads') then
    create policy "Users can create leads" on public.hvac_leads for insert with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own leads' and tablename = 'hvac_leads') then
    create policy "Users can update own leads" on public.hvac_leads for update using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can delete own leads' and tablename = 'hvac_leads') then
    create policy "Users can delete own leads" on public.hvac_leads for delete using (auth.uid() = owner_id);
  end if;
end $$;

-- 4. Lead Events Table Policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view lead events' and tablename = 'lead_events') then
    create policy "Users can view lead events" on public.lead_events
      for select using (exists (select 1 from public.hvac_leads where hvac_leads.id = lead_events.lead_id));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can create lead events' and tablename = 'lead_events') then
    create policy "Users can create lead events" on public.lead_events
      for insert with check (exists (select 1 from public.hvac_leads where hvac_leads.id = lead_events.lead_id));
  end if;
end $$;

-- 5. Lead Notes Table Policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view lead notes' and tablename = 'lead_notes') then
    create policy "Users can view lead notes" on public.lead_notes
      for select using (exists (select 1 from public.hvac_leads where hvac_leads.id = lead_notes.lead_id));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can create lead notes' and tablename = 'lead_notes') then
    create policy "Users can create lead notes" on public.lead_notes
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own notes' and tablename = 'lead_notes') then
    create policy "Users can update own notes" on public.lead_notes
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can delete own notes' and tablename = 'lead_notes') then
    create policy "Users can delete own notes" on public.lead_notes
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 6. Appointments Table Policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view appointments' and tablename = 'appointments') then
    create policy "Users can view appointments" on public.appointments
      for select using (exists (select 1 from public.hvac_leads where hvac_leads.id = appointments.lead_id));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can create appointments' and tablename = 'appointments') then
    create policy "Users can create appointments" on public.appointments
      for insert with check (exists (select 1 from public.hvac_leads where hvac_leads.id = appointments.lead_id));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update appointments' and tablename = 'appointments') then
    create policy "Users can update appointments" on public.appointments
      for update using (exists (select 1 from public.hvac_leads where hvac_leads.id = appointments.lead_id));
  end if;
end $$;

-- 7. Reminders Table Policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view reminders' and tablename = 'reminders') then
    create policy "Users can view reminders" on public.reminders
      for select using (exists (select 1 from public.hvac_leads where hvac_leads.id = reminders.lead_id));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can create reminders' and tablename = 'reminders') then
    create policy "Users can create reminders" on public.reminders
      for insert with check (exists (select 1 from public.hvac_leads where hvac_leads.id = reminders.lead_id));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update reminders' and tablename = 'reminders') then
    create policy "Users can update reminders" on public.reminders
      for update using (exists (select 1 from public.hvac_leads where hvac_leads.id = reminders.lead_id));
  end if;
end $$;
