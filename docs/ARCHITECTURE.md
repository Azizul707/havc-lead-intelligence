# System Architecture — AI Lead Scoring CRM

**Version:** 1.1.0  
**Last Updated:** June 29, 2026

---

## Overview

The AI Lead Scoring CRM platform is a production-grade SaaS application that receives HVAC leads from webhooks, stores them in Supabase, analyzes them with AI, and presents them in a professional dashboard.

```

                    ┌──────────────┐
                    │   External   │
                    │   Sources    │
                    │  (Website,   │
                    │   Google,    │
                    │   Facebook)  │
                    └──────┬───────┘
                           │ HTTP POST
                           ▼
                    ┌──────────────┐
                    │   n8n       │
                    │  Workflows  │
                    │  ┌────────┐ │
                    │  │ Lead   │ │
                    │  │Ingest  │ │
                    │  └───┬────┘ │
                    │  ┌───▼────┐ │
                    │  │  AI    │ │
                    │  │Analyze │ │
                    │  └───┬────┘ │
                    │  ┌───▼────┐ │
                    │  │ Notify │ │
                    │  └────────┘ │
                    └──────┬───────┘
                           │ Supabase API
                           ▼
                    ┌──────────────┐
                    │   Supabase   │
                    │  ┌────────┐  │
                    │  │Postgres│  │
                    │  │  RLS   │  │
                    │  │Realtime│  │
                    │  └────────┘  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Next.js 16  │
                    │  App Router  │
                    │  ┌────────┐  │
                    │  │Dashboard│ │
                    │  │ Leads  │ │
                    │  │CRM Board│ │
                    │  │Analytics│ │
                    │  └────────┘  │
                    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │    Vercel    │
                    │  (Hosting)   │
                    └──────────────┘

```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router) | Server-side rendered React application |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui | Modern, responsive interface |
| **State** | TanStack Table, Recharts | Data tables and charts |
| **Auth** | Supabase Auth | Email/password authentication |
| **Database** | Supabase (PostgreSQL) | Data persistence with RLS |
| **Realtime** | Supabase Realtime | Live dashboard updates |
| **AI** | OpenRouter API | Lead intelligence and scoring |
| **Automation** | n8n | Workflow automation |
| **Hosting** | Vercel | Production deployment |

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to `auth.users` |
| `hvac_leads` | Core lead data with AI analysis fields |
| `lead_events` | Audit timeline for each lead |
| `lead_notes` | Internal dispatcher notes |
| `appointments` | Technician site visits |
| `reminders` | Follow-up reminders |
| `schema_versions` | Database version tracking |

### Key Relationships

- `hvac_leads.owner_id` → `auth.users.id` (nullable — unassigned leads visible to all)
- `lead_events.lead_id` → `hvac_leads.id` (cascade delete)
- `lead_notes.lead_id` → `hvac_leads.id` (cascade delete)
- `appointments.lead_id` → `hvac_leads.id` (cascade delete)
- `reminders.lead_id` → `hvac_leads.id` (cascade delete)

### Security

- Row Level Security (RLS) enabled on all tables
- Users can view all leads (company-wide visibility)
- Users can only modify leads they own
- Auth is handled by Supabase Auth

---

## Data Flow

### Lead Ingestion
1. Lead submitted via website form, ad campaign, or phone
2. n8n webhook receives lead data
3. n8n validates and inserts into `hvac_leads` (Supabase)
4. n8n triggers AI analysis workflow
5. OpenRouter AI analyzes the lead and updates score/priority
6. n8n optionally sends email notification
7. Dashboard updates in real-time via Supabase Realtime

### User Actions
1. Dispatcher views leads on Dashboard, Leads page, or CRM Board
2. Status changes (drag-and-drop or actions) update Supabase
3. Database triggers log events automatically
4. Appointment scheduling creates records and updates lead status
5. Follow-up reminders track pending customer contacts

---

## Configuration System

```
config/
├── index.ts              ← Entry point
├── brandingConfig.ts     ← Company branding (colors, logo, contact)
├── clientConfig.ts       ← Client settings (timezone, currency, locale)
├── constants.ts          ← Enums, statuses, URL paths
├── envConfig.ts          ← Environment configuration
└── README.md             ← Configuration documentation
```

All configuration is centralized. Changing one file updates the application.

---

## n8n Workflows

```
n8n/
├── workflows/
│   ├── lead-ingestion.json        ← Webhook → validate → Supabase → trigger AI
│   ├── ai-lead-analysis.json      ← Fetch lead → OpenRouter → update Supabase
│   ├── send-notification.json     ← SMTP email notifications
│   ├── schedule-appointment.json  ← Create appointment → update lead
│   └── webhook-dispatcher.json    ← Central action router
├── credentials/                   ← Placeholder templates (env var based)
└── webhooks/webhook-config.md     ← Payload schemas and configuration
```

All workflows use environment variables — no hardcoded secrets.

---

## Security Architecture

- **Authentication**: Supabase Auth with email/password
- **Authorization**: RLS policies on all tables
- **API Security**: Server actions (no client-side API calls)
- **AI Security**: OpenRouter calls happen in n8n (not frontend)
- **Input Validation**: Zod schemas on all forms
- **HTTPS**: Enforced via Vercel deployment

---

## Deployment Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client n8n  │────▶│  Supabase    │◀────│   Vercel     │
│  (Docker)    │     │  (Postgres)  │     │  (Next.js)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

Each client gets:
- Their own GitHub repository (from template)
- Their own Supabase project
- Their own OpenRouter API key
- Their own n8n instance (Docker)
- Their own Vercel deployment

---

## Related Documentation

- [Deployment Guide](DEPLOYMENT_VERCEL.md)
- [Local Development](LOCAL_DEV.md)
- [Database Installation](../DATABASE_INSTALL.md)
- [Configuration Guide](../config/README.md)
- [Production Checklist](PRODUCTION_CHECKLIST.md)
- [Maintenance Guide](MAINTENANCE.md)
