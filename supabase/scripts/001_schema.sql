-- =============================================================================
-- AI Lead Scoring CRM - Schema Installer
-- Version: 1.1.0
-- Part 1: Extensions, Tables, Functions, Triggers, Indexes
-- =============================================================================

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

-- 10. Performance Indexes
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

-- 10. Trigger: Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- 11. Trigger: Auto-log lead creation events
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

-- 12. Trigger: Auto-log status changes
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

-- 13. Bind triggers to tables
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
