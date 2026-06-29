# HVAC AI Lead Intelligence Platform — Database Installation Guide

**Version:** 1.1.0  
**Database:** PostgreSQL (Supabase)  
**Target Audience:** New HVAC client deployment

This guide walks you through setting up a brand-new Supabase database for a client deployment.  
Estimated time: **Under 30 minutes**.

---

## Table of Contents

1. [Create a New Supabase Project](#1-create-a-new-supabase-project)
2. [Run the Master Installer](#2-run-the-master-installer)
3. [Verify Installation](#3-verify-installation)
4. [Reset Demo Data (Optional)](#4-reset-demo-data-optional)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Common Troubleshooting](#6-common-troubleshooting)
7. [Database Versioning](#7-database-versioning)
8. [File Reference](#8-file-reference)

---

## 1. Create a New Supabase Project

1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Click **New Project**.
3. Configure:
   - **Name:** `hvac-lead-intelligence-client` (or your client name)
   - **Database Password:** Use a strong password (min 16 chars, mix of uppercase, lowercase, numbers, symbols)
   - **Region:** Choose the region closest to your client's operational area
     - US East (North Virginia) — for US clients
     - US West (Oregon) — for West Coast US
     - Canada (Central) — for Canadian clients
     - Australia (Southeast) — for Australian clients
4. Click **Create new project** and wait ~2 minutes for provisioning.

---

## 2. Run the Master Installer

The master installer (`supabase/install.sql`) contains everything in one file — schema, indexes, triggers, RLS, realtime, and demo data.

### Steps

1. In your Supabase dashboard, navigate to **SQL Editor** (left sidebar).
2. Click **New Query**.
3. Open the file `supabase/install.sql` from this project.
4. Copy the **entire contents** and paste into the SQL Editor.
5. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`).
6. Wait for execution to complete. You should see:
   ```
   Installation complete!
   Schema version: 1.1.0
   Database: HVAC AI Lead Intelligence Platform
   ```

### What the Installer Does

| Step | Description |
|------|-------------|
| Extensions | Enables `pgcrypto` for UUID generation |
| Version Tracking | Creates `schema_versions` table to track migrations |
| Tables | Creates all 7 tables: profiles, hvac_leads, lead_events, lead_notes, appointments, reminders |
| Indexes | Creates 13 performance indexes on frequently queried columns |
| Functions | Creates 3 trigger functions: `handle_updated_at`, `log_lead_creation_event`, `log_lead_status_change` |
| Triggers | Binds 6 triggers to tables for automatic timestamp updates and event logging |
| RLS | Enables Row Level Security on all tables with 20+ policies |
| Realtime | Adds tables to `supabase_realtime` publication for live updates |
| Seed Data | Populates 5 realistic HVAC leads, 1 appointment, 2 reminders, 2 events |

### Run Schema Only (Without Demo Data)

If you want only the schema without demo data, run the individual scripts in order:

1. `supabase/scripts/001_schema.sql`
2. `supabase/scripts/002_rls.sql`
3. `supabase/scripts/003_realtime.sql`

Then seed data later with `supabase/seed/seed.sql`.

---

## 3. Verify Installation

### Quick Verification

1. Open a **New Query** in SQL Editor.
2. Open and copy the contents of `supabase/verify.sql`.
3. Paste and click **Run**.
4. Verify the output shows:

| Check | Expected Result |
|-------|----------------|
| All 7 tables exist | `profiles`, `hvac_leads`, `lead_events`, `lead_notes`, `appointments`, `reminders`, `schema_versions` |
| RLS enabled on all | `rls_enabled` = `true` for all tables |
| Schema version | Version `1.1.0` listed |
| Seed data | 5 leads, 1 appointment, 2 reminders |
| Functions exist | `handle_updated_at`, `log_lead_creation_event`, `log_lead_status_change` |
| Indexes exist | All 13 indexes present |

### Manual Verification Queries

```sql
-- Check version
select * from public.schema_versions order by installed_at desc limit 1;

-- Check lead counts
select status, count(*) from public.hvac_leads group by status;

-- Check RLS
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'hvac_leads', 'lead_events', 'lead_notes', 'appointments', 'reminders');
```

---

## 4. Reset Demo Data (Optional)

If you need to clear demo data for production go-live while keeping the schema intact:

1. Open a **New Query** in SQL Editor.
2. Open and copy the contents of `supabase/reset.sql`.
3. Paste and click **Run**.

```sql
-- Reset removes all data from these tables:
truncate public.lead_notes cascade;
truncate public.lead_events cascade;
truncate public.appointments cascade;
truncate public.reminders cascade;
truncate public.hvac_leads cascade;
truncate public.profiles cascade;
```

After reset, you can re-seed by running `supabase/seed/seed.sql` again.

---

## 5. Configure Environment Variables

After installation, configure your local environment:

1. In Supabase dashboard, go to **Project Settings** > **API**.
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-only)
3. Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-key

# n8n
N8N_URL=http://localhost:5678
N8N_USERNAME=admin
N8N_PASSWORD=your-password
```

---

## 6. Common Troubleshooting

### "relation does not exist"

**Cause:** Scripts run out of order.  
**Fix:** Always use `install.sql` (it runs everything in the correct order). If running individual scripts, run `001_schema.sql` before `002_rls.sql`.

### "permission denied for table"

**Cause:** RLS policies not created or user not authenticated.  
**Fix:** Run `002_rls.sql` and ensure the user is signed in via Supabase Auth.

### "column referenced in foreign key constraint does not exist"

**Cause:** Tables created in wrong order.  
**Fix:** Run `install.sql` which handles dependency ordering.

### "cannot insert multiple commands into a single prepared statement"

**Cause:** SQL editor limitations with certain clients.  
**Fix:** Ensure you're using the Supabase SQL Editor directly.

### Seed data not appearing

**Cause:** Install might have failed mid-way or data was reset.  
**Fix:** Run `seed/seed.sql` separately or re-run `install.sql`.

### Realtime updates not working

**Cause:** Tables not added to publication.  
**Fix:** Run `scripts/003_realtime.sql` to add them.

---

## 7. Database Versioning

The `schema_versions` table tracks all database changes:

```sql
-- View version history
select * from public.schema_versions order by installed_at desc;

-- Check current version
select version as current_version from public.schema_versions order by installed_at desc limit 1;
```

**Current Version: 1.1.0**  
*Sprint 05.2 — Database installer package with organized scripts, seed data, and verification*

When upgrading in the future:
1. Create a new migration file (e.g., `scripts/004_upgrade.sql`)
2. Register it in `schema_versions` with the new version number
3. Document what changed

---

## 8. File Reference

```
supabase/
├── install.sql                 ← MASTER INSTALLER (run this first)
├── reset.sql                   ← Safe reset (preserves schema, removes data)
├── verify.sql                  ← Full integrity verification
├── version.sql                 ← Quick version check
├── scripts/
│   ├── 001_schema.sql          ← Extensions, tables, indexes, triggers
│   ├── 002_rls.sql             ← RLS policies
│   └── 003_realtime.sql        ← Realtime publication
├── seed/
│   ├── seed.sql                ← Seed data entry (for re-seeding after reset)
│   ├── 001_demo_company.sql    ← Demo company info (reference only)
│   ├── 002_leads.sql           ← 5 realistic HVAC leads
│   ├── 003_appointments.sql    ← 1 demo appointment
│   ├── 004_reminders.sql       ← 2 demo reminders
│   └── 005_events.sql          ← 2 demo events
└── migrations/
    └── 2024062801_rls_policies.sql   ← Original migration (preserved)
```

---

## Quick Start (New Client Deployment)

```bash
# 1. Create new Supabase project (via dashboard)
# 2. Run master installer
#    - Open supabase/install.sql in SQL Editor → Run
# 3. Verify
#    - Open supabase/verify.sql in SQL Editor → Run
# 4. Configure .env.local with your Supabase credentials
# 5. Deploy application to Vercel
```

Your database is now ready. The application will connect automatically when environment variables are set.

---

*Generated for HVAC AI Lead Intelligence Platform | Sprint 05.2 | June 2026*
