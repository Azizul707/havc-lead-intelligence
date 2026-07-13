-- =============================================================================
-- AI Lead Scoring CRM - Master Database Installer
-- Version: 1.1.0
-- Target: PostgreSQL (Supabase)
-- Instructions: Copy the ENTIRE contents of this file into Supabase SQL Editor
--               and execute. This runs schema, RLS, realtime, and seed data.
-- =============================================================================

-- ===========================================================================
-- PART 1: EXTENSIONS & SCHEMA VERSIONING
-- ===========================================================================

-- 1. Enable Required Extensions
create extension if not exists pgcrypto;

-- 2. Schema Version Tracking Table
create table if not exists public.schema_versions (
    id uuid default gen_random_uuid() not null primary key,
    version text not null,
    description text not null,
    installed_at timestamptz default timezone('utc'::text, now()) not null
);

-- Register version
insert into public.schema_versions (version, description)
values ('1.1.0', 'Sprint 05.2 - Database installer package with organized scripts, seed data, and verification')
on conflict do nothing;

-- ===========================================================================
-- PART 2: TABLES
-- ===========================================================================

-- 3. Profiles Table (links to auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    full_name text,
    company_name text,
    phone text,
    timezone text default 'UTC'::text,
    country text default 'United States'::text,
    role text default 'DISPATCHER'::text not null constraint role_check check (role in ('ADMIN', 'DISPATCHER', 'CSR', 'TECHNICIAN')),
    n8n_webhook_url text,
    emergency_email_dispatch boolean default true not null,
    auto_ai_ingestion boolean default true not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. HVAC Leads Table
create table if not exists public.hvac_leads (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    owner_id uuid references auth.users(id) on delete cascade,
    customer_name text not null,
    phone text not null constraint phone_length_check check (char_length(phone) >= 10 and char_length(phone) <= 20),
    email text,
    city text not null,
    service_type text not null,
    property_type text not null,
    issue_description text not null constraint issue_length_check check (char_length(issue_description) >= 20 and char_length(issue_description) <= 2000),
    lead_quality text not null constraint lead_quality_check check (lead_quality in ('LOW', 'MEDIUM', 'HIGH')),
    urgency text not null constraint urgency_check check (urgency in ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY')),
    estimated_job_value text not null constraint job_value_check check (estimated_job_value in ('LOW', 'MEDIUM', 'HIGH')),
    customer_intent text not null constraint intent_check check (customer_intent in ('UNKNOWN', 'SHOPPING', 'READY_TO_BUY')),
    recommended_response_time text not null,
    service_category text not null,
    summary text not null,
    recommended_action text not null,
    lead_score integer not null constraint lead_score_check check (lead_score >= 0 and lead_score <= 100),
    priority text not null constraint priority_check check (priority in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status text default 'NEW'::text not null constraint status_check check (status in ('NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'LOST')),
    source text default 'Website'::text not null constraint source_check check (source in ('Website', 'Google Ads', 'Facebook', 'Referral', 'Phone', 'Manual'))
);

-- 5. Lead Events Table (Audit Timeline)
create table if not exists public.lead_events (
    id uuid default gen_random_uuid() not null primary key,
    lead_id uuid references public.hvac_leads(id) on delete cascade not null,
    event_type text not null constraint event_type_check check (
        event_type in ('LEAD_CREATED', 'AI_ANALYZED', 'EMAIL_SENT', 'SMS_SENT', 'CUSTOMER_CONTACTED', 'JOB_SCHEDULED', 'JOB_COMPLETED', 'STATUS_CHANGED', 'NOTE_ADDED')
    ),
    description text not null,
    metadata jsonb default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. Lead Notes Table
create table if not exists public.lead_notes (
    id uuid default gen_random_uuid() not null primary key,
    lead_id uuid references public.hvac_leads(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    note text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. Appointments Table
create table if not exists public.appointments (
    id uuid default gen_random_uuid() not null primary key,
    lead_id uuid references public.hvac_leads(id) on delete cascade not null,
    appointment_date date not null,
    appointment_time time not null,
    appointment_type text not null,
    status text not null constraint appointment_status_check check (status in ('Scheduled', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled')),
    notes text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. Reminders Table
create table if not exists public.reminders (
    id uuid default gen_random_uuid() not null primary key,
    lead_id uuid references public.hvac_leads(id) on delete cascade not null,
    reminder_date date not null,
    reminder_time time not null,
    priority text not null constraint reminder_priority_check check (priority in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    message text not null,
    status text default 'Pending'::text not null constraint reminder_status_check check (status in ('Pending', 'Completed', 'Overdue')),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 9. Service Types Table (user-configurable appointment service types)
create table if not exists public.service_types (
    id uuid default gen_random_uuid() not null primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    display_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ===========================================================================
-- PART 3: INDEXES
-- ===========================================================================

create index if not exists idx_leads_owner on public.hvac_leads(owner_id);
create index if not exists idx_leads_priority on public.hvac_leads(priority);
create index if not exists idx_leads_status on public.hvac_leads(status);
create index if not exists idx_leads_created on public.hvac_leads(created_at desc);
create index if not exists idx_leads_city on public.hvac_leads(city);
create index if not exists idx_leads_service on public.hvac_leads(service_type);
create index if not exists idx_events_lead_id on public.lead_events(lead_id);
create index if not exists idx_events_created on public.lead_events(created_at desc);
create index if not exists idx_notes_lead_id on public.lead_notes(lead_id);
create index if not exists idx_appointments_lead_id on public.appointments(lead_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);
create index if not exists idx_reminders_lead_id on public.reminders(lead_id);
create index if not exists idx_reminders_date on public.reminders(reminder_date);
create index if not exists idx_service_types_user_id on public.service_types(user_id);
create index if not exists idx_service_types_display_order on public.service_types(user_id, display_order);
create unique index if not exists idx_service_types_user_name on public.service_types(user_id, lower(name));

-- ===========================================================================
-- PART 4: FUNCTIONS & TRIGGERS
-- ===========================================================================

-- Trigger: Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger: Auto-log lead creation events
create or replace function public.log_lead_creation_event()
returns trigger as $$
begin
    insert into public.lead_events (lead_id, event_type, description, metadata)
    values (
        new.id,
        'LEAD_CREATED',
        'New lead ingested from ' || new.source || ' for customer ' || new.customer_name,
        jsonb_build_object('customer_name', new.customer_name, 'source', new.source, 'service_type', new.service_type)
    );

    if new.summary is not null and new.summary <> '' then
        insert into public.lead_events (lead_id, event_type, description, metadata)
        values (
            new.id,
            'AI_ANALYZED',
            'AI qualified the lead for ' || new.customer_name || ' (Score: ' || new.lead_score || ')',
            jsonb_build_object('lead_score', new.lead_score, 'priority', new.priority, 'quality', new.lead_quality)
        );
    end if;

    return new;
end;
$$ language plpgsql;

-- Trigger: Auto-log status changes
create or replace function public.log_lead_status_change()
returns trigger as $$
begin
    if old.status <> new.status then
        insert into public.lead_events (lead_id, event_type, description, created_by)
        values (
            new.id,
            'STATUS_CHANGED',
            'Status changed from ' || old.status || ' to ' || new.status,
            auth.uid()
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Bind triggers to tables
create trigger trigger_update_profiles_updated_at
    before update on public.profiles
    for each row execute function public.handle_updated_at();

create trigger trigger_update_leads_updated_at
    before update on public.hvac_leads
    for each row execute function public.handle_updated_at();

create trigger trigger_update_appointments_updated_at
    before update on public.appointments
    for each row execute function public.handle_updated_at();

create trigger trigger_update_reminders_updated_at
    before update on public.reminders
    for each row execute function public.handle_updated_at();

create trigger trigger_update_service_types_updated_at
    before update on public.service_types
    for each row execute function public.handle_updated_at();

create trigger trigger_log_lead_creation
    after insert on public.hvac_leads
    for each row execute function public.log_lead_creation_event();

create trigger trigger_log_lead_status_change
    after update of status on public.hvac_leads
    for each row execute function public.log_lead_status_change();

-- ===========================================================================
-- PART 5: ROW LEVEL SECURITY
-- ===========================================================================

-- Enable RLS
alter table if exists public.profiles enable row level security;
alter table if exists public.hvac_leads enable row level security;
alter table if exists public.lead_events enable row level security;
alter table if exists public.lead_notes enable row level security;
alter table if exists public.appointments enable row level security;
alter table if exists public.reminders enable row level security;
alter table if exists public.service_types enable row level security;

-- Service Types Policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own service types' and tablename = 'service_types') then
    create policy "Users can view own service types" on public.service_types
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own service types' and tablename = 'service_types') then
    create policy "Users can insert own service types" on public.service_types
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own service types' and tablename = 'service_types') then
    create policy "Users can update own service types" on public.service_types
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can delete own service types' and tablename = 'service_types') then
    create policy "Users can delete own service types" on public.service_types
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Profiles Policies
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

-- HVAC Leads Policies
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
  -- Drop and recreate to allow deleting shared (owner_id IS NULL) leads
  drop policy if exists "Users can delete own leads" on public.hvac_leads;
  create policy "Users can delete own leads" on public.hvac_leads for delete using (auth.uid() = owner_id OR owner_id IS NULL);
  end if;
end $$;

-- Lead Events Policies
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

-- Lead Notes Policies
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

-- Appointments Policies
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

-- Reminders Policies
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

-- ===========================================================================
-- PART 6: REALTIME PUBLICATION
-- ===========================================================================

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

-- ===========================================================================
-- PART 7: SEED DATA
-- ===========================================================================

-- 7a. Demo Leads (5 realistic HVAC leads)
insert into public.hvac_leads (id, customer_name, phone, email, city, service_type, property_type, issue_description, lead_quality, urgency, estimated_job_value, customer_intent, recommended_response_time, service_category, summary, recommended_action, lead_score, priority, status, source)
values
(
    '10000000-0000-0000-0000-000000000001',
    'Arafin Azizul',
    '5551234567',
    'arafinazizul@gmail.com',
    'Dallas',
    'AC Repair',
    'Residential',
    'AC is blowing warm air and making a loud humming noise in the backyard. Unit is 8 years old, R-410A refrigerant.',
    'HIGH',
    'NORMAL',
    'MEDIUM',
    'READY_TO_BUY',
    'Within 2 Hours',
    'Cooling',
    'AC blowing warm air, outdoor unit compressor humming. Customer is ready to book.',
    'Call customer immediately to schedule diagnostic visit.',
    85,
    'HIGH',
    'NEW',
    'Website'
),
(
    '20000000-0000-0000-0000-000000000002',
    'Sarah Jenkins',
    '5559876543',
    'sjenkins@yahoo.com',
    'Houston',
    'Heater Maintenance',
    'Residential',
    'Heater is emitting a burning smell when turned on for the winter season. Customer wants a safety inspection before full winter.',
    'MEDIUM',
    'NORMAL',
    'LOW',
    'SHOPPING',
    'Within 24 Hours',
    'Heating',
    'Burning smell observed on furnace startup. Standard safety check required.',
    'Email maintenance options or follow up tomorrow morning.',
    60,
    'MEDIUM',
    'CONTACTED',
    'Google Ads'
),
(
    '30000000-0000-0000-0000-000000000003',
    'Michael Chang',
    '5554567890',
    'mchang@changlegal.com',
    'Austin',
    'Commercial HVAC Overhaul',
    'Commercial',
    'Lobby split system is completely dead, office temperature is rising rapidly. Multiple tenants complaining.',
    'HIGH',
    'EMERGENCY',
    'HIGH',
    'READY_TO_BUY',
    'Immediate (Within 30m)',
    'Cooling',
    'Commercial building lobby cooling failure. Extreme business downtime risk.',
    'Dispatch emergency commercial diagnostic technician immediately.',
    98,
    'CRITICAL',
    'SCHEDULED',
    'Phone'
),
(
    '40000000-0000-0000-0000-000000000004',
    'David Miller',
    '5553210987',
    'dmiller@hotmail.com',
    'Fort Worth',
    'Heat Pump Installation',
    'Residential',
    'Interested in replacing old inefficient 15 SEER heat pump with new energy star unit. 2000 sq ft home.',
    'HIGH',
    'LOW',
    'HIGH',
    'SHOPPING',
    'Within 48 Hours',
    'Cooling',
    'Residential heat pump installation estimate request. High value sales lead.',
    'Schedule senior comfort advisor for home heat loss calculation.',
    75,
    'MEDIUM',
    'NEW',
    'Referral'
),
(
    '50000000-0000-0000-0000-000000000005',
    'Emma Rodriguez',
    '5551112222',
    'erodriguez@outlook.com',
    'San Antonio',
    'Furnace Repair',
    'Residential',
    'Furnace will not ignite and thermostat is throwing error code 14. House temperature dropping to 55F.',
    'HIGH',
    'HIGH',
    'MEDIUM',
    'READY_TO_BUY',
    'Within 1 Hour',
    'Heating',
    'Furnace ignition lockout error code 14. Immediate cold weather risk.',
    'Call customer immediately to schedule diagnostic visit.',
    92,
    'CRITICAL',
    'NEW',
    'Facebook'
);

-- 7b. Demo Appointments (1 scheduled commercial service)
insert into public.appointments (id, lead_id, appointment_date, appointment_time, appointment_type, status, notes)
values (
    '30000000-3333-3333-3333-333333333333',
    '30000000-0000-0000-0000-000000000003',
    current_date,
    '14:30:00',
    'Emergency Repair',
    'Scheduled',
    'Attic access ladder on the 2nd floor corridor. Technician needs tall A-frame ladder. Commercial building at 4514 Congress Ave, Austin.'
);

-- 7c. Demo Reminders (1 pending, 1 overdue)
insert into public.reminders (id, lead_id, reminder_date, reminder_time, priority, message, status)
values
(
    '20000000-2222-2222-2222-222222222222',
    '20000000-0000-0000-0000-000000000002',
    current_date + interval '1 day',
    '09:00:00',
    'MEDIUM',
    'Call Sarah Jenkins to confirm furnace safety check appointment in Houston.',
    'Pending'
),
(
    '40000000-4444-4444-4444-444444444444',
    '40000000-0000-0000-0000-000000000004',
    current_date - interval '1 day',
    '10:15:00',
    'HIGH',
    'Follow up on heat pump installation quote sent to David Miller yesterday. High-value opportunity.',
    'Pending'
);

-- 7d. Demo Events (audit timeline entries)
insert into public.lead_events (lead_id, event_type, description, metadata)
values
(
    '30000000-0000-0000-0000-000000000003',
    'NOTE_ADDED',
    'Dispatcher logged an internal note: "Commercial lobby AC compressor is dead. Business critical incident. Building manager notified."',
    '{"bulk": false}'::jsonb
),
(
    '30000000-0000-0000-0000-000000000003',
    'STATUS_CHANGED',
    'Technician visit scheduled for commercial split system overhaul at 4514 Congress Ave, Austin.',
    '{"new_status": "SCHEDULED"}'::jsonb
);

-- ===========================================================================
-- INSTALLATION COMPLETE
-- ===========================================================================

select 'Installation complete!' as status;
select 'Schema version: 1.1.0' as version;
select 'Database: AI Lead Scoring CRM' as database;
