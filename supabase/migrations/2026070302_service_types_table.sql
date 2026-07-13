-- =============================================================================
-- Migration: 2026070302_service_types_table
-- Description: Add service_types table for dynamic appointment service types
-- Each user manages their own service types for appointment scheduling
-- =============================================================================

-- 1. Create service_types table
create table if not exists public.service_types (
    id uuid default gen_random_uuid() not null primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    display_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Indexes
create index if not exists idx_service_types_user_id on public.service_types(user_id);
create index if not exists idx_service_types_display_order on public.service_types(user_id, display_order);

-- 3. Unique constraint: one service type name per user
create unique index if not exists idx_service_types_user_name
    on public.service_types(user_id, lower(name));

-- 4. Trigger for updated_at
create trigger trigger_update_service_types_updated_at
    before update on public.service_types
    for each row execute function public.handle_updated_at();

-- 5. Enable RLS
alter table if exists public.service_types enable row level security;

-- 6. RLS Policies
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

-- 7. Seed default service types for existing users (backfill)
-- This inserts the 4 default types for any existing profile that doesn't have service types yet
insert into public.service_types (user_id, name, display_order, is_active)
select id, 'Installation', 0, true from public.profiles
where id not in (select distinct user_id from public.service_types)
union all
select id, 'Repair', 1, true from public.profiles
where id not in (select distinct user_id from public.service_types where name = 'Repair')
union all
select id, 'Maintenance', 2, true from public.profiles
where id not in (select distinct user_id from public.service_types where name = 'Maintenance')
union all
select id, 'Diagnostic', 3, true from public.profiles
where id not in (select distinct user_id from public.service_types where name = 'Diagnostic');

select 'Service types table created and seeded!' as status;
