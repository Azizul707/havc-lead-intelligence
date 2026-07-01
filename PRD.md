# HVAC Lead Intelligence Platform — PRD

## Overview

Production-grade SaaS platform for HVAC companies to ingest, qualify, and manage customer leads through an AI-powered dispatch console. Leads arrive via n8n webhook, receive automated AI analysis through OpenRouter, and are surfaced in a real-time dashboard with CRM board, analytics, and dispatcher tooling.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, CSS custom properties (light/dark mode) |
| UI Components | Custom primitives (Card, Badge, EmptyState, Skeleton), Lucide icons, Recharts |
| Forms | React Hook Form, Zod validation |
| Database | Supabase (PostgreSQL), Row Level Security, Realtime subscriptions |
| Auth | Supabase Auth (email/password, cookie-based SSR sessions) |
| Automation | n8n workflows |
| AI | OpenRouter API (via n8n) |

---

## Authentication

- Email/password sign-in and sign-up via Supabase Auth.
- Sign-up creates an auth user and inserts a row in the `profiles` table with `full_name` and `company_name`.
- Cookie-based SSR session management via `@supabase/ssr`.
- Unauthenticated users are redirected to `/login`.
- Root route (`/`) auto-redirects to `/dashboard` (authenticated) or `/login` (unauthenticated).

---

## Layout

### DashboardShell

A client component wrapping all authenticated pages with:

- **Desktop sidebar** (280px fixed): Brand logo ("HVAC AI"), navigation links (Dashboard, Leads, CRM Board, Analytics, Settings, Profile), user profile card with initials, and a Sign Out button.
- **Mobile drawer**: Slide-out navigation with backdrop, same links as desktop sidebar, toggleable via hamburger button.
- **Top header bar**: Mobile menu button, search input placeholder, notification bell icon (decorative), breadcrumb trail showing company name and current path.
- **Main content area**: Max-width 1600px, padding 32px.

Navigation highlights the active route with `aria-current="page"`. Active link uses primary color background at 10% opacity.

---

## Dashboard

Route: `/dashboard`

### Data Loading

Server component fetches all `hvac_leads` rows where `owner_id` matches the current user or is null, ordered by `created_at` descending. Also fetches the 10 most recent `lead_events` with a join to `hvac_leads(customer_name)`.

### Client Component Features

**Realtime subscriptions** — 4 Supabase Realtime channels sync `hvac_leads`, `lead_events`, `appointments`, and `reminders` tables on INSERT/UPDATE/DELETE.

**Filter bar** — Dropdown selectors for time range (All Time, Today Only, Last 7 Days, Last 30 Days), priority (All, Low, Medium, High, Critical), and city (dynamic list from available leads).

**KPI Cards** (4):
- Today's Appointments — count of scheduled appointments with today's date
- Pending Follow-ups — count of reminders with status "Pending"
- Overdue Follow-ups — count of pending reminders past their due date (pulses red if > 0)
- Scheduled Tech Jobs — count of leads with status "SCHEDULED"

**Today's Schedule Widget** — Lists today's appointments with customer name, service type, appointment type, time, and priority badge. Clicking a row opens the lead details drawer. Shows an empty state with inbox icon when none exist.

**Upcoming Reminders Widget** — Chronologically sorted list of pending reminders with message, due date/time, and priority badge. Overdue reminders are highlighted with red styling and "OVERDUE" label. Shows an empty state with bell-off icon when none exist.

**Charts** (lazy-loaded via `next/dynamic` with SSR disabled):
- 7-day Lead Trend area chart (Recharts)
- Priority Breakdown donut chart with center label showing total filtered lead count

**Recent Leads Table** — Top 10 leads from the filtered set with columns: Customer, Source, City, Service, Priority (color-coded badge), Lead Score, Status (color-coded badge). Clicking a row opens the lead details drawer. Shows "No Leads Ingested" empty state.

**Recent Activity Feed** — Real-time event log showing event type icons, descriptions, customer names, and relative timestamps (via `formatRelativeTime`). Shows "No active events logged" empty state.

### Server Actions (dashboard/actions.ts)

| Action | Purpose |
|---|---|
| `triggerLeadAction` | Execute quick action (call/email/contact/schedule/complete) — validates auth, fetches lead, maps to status change, dispatches n8n webhook, updates lead status, inserts event records, optionally completes active appointments |
| `updateLeadStatusDirectly` | Direct status update from Kanban drag-and-drop — updates lead, logs STATUS_CHANGED event, logs LEAD_COMPLETED or LEAD_LOST for terminal statuses |
| `bulkUpdateLeadStatus` | Batch status change on selected leads — updates all, inserts bulk events, logs lifecycle events for terminal statuses |
| `bulkDeleteLeads` | Batch delete selected leads |
| `scheduleAppointment` | Insert appointment record, set lead status to SCHEDULED, log APPOINTMENT_CREATED event |
| `addLeadNote` | Insert note, log NOTE_ADDED event |
| `deleteLeadNote` | Delete note, log STATUS_CHANGED event |
| `updateLeadNote` | Edit note content |
| `createReminder` | Insert reminder with priority and message, log NOTE_ADDED event |
| `completeReminder` | Mark reminder as Completed, log STATUS_CHANGED event |
| `updateAppointment` | Edit appointment date/time/type/notes |

All server actions follow a consistent pattern: auth check → Zod validation → Supabase mutation → event logging → revalidation of `/dashboard`, `/leads`, and `/crm` paths.

---

## Leads

Route: `/leads`

### Server Page

- Server-side pagination (`PAGE_SIZE = 25`, configurable 10–100 per page).
- Server-side filtering: search (customer_name, phone, city, service_type via `ilike`), priority, city, source, service_type.
- Server-side sorting: newest, oldest, score descending, score ascending. Priority sort is handled client-side since Supabase cannot express custom weight ordering.
- Fetches distinct cities, sources, and service_types for filter dropdown population.
- Resets to page 1 on any filter change.

### Client Component

**Search** — Debounced (400ms) local input that pushes URL search params and triggers server navigation.

**Filters** — Dropdown selectors for priority, city, source, service type. Each change navigates with updated URL params.

**Sort** — Dropdown: Newest, Oldest, Highest Score, Lowest Score, Priority (client-side sort using weight map: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1).

**Table** — Columns: Customer, Source (with globe icon), Phone, City, Service, Priority (color-coded badge), Lead Score, Status (color-coded badge). Clicking a row opens the lead details drawer.

**Bulk Operations** — Checkbox per row + select-all in header. Floating toolbar appears when items are selected showing count and action buttons (Contacted, Complete, Lost, Delete). Confirmation dialog for delete.

**CSV Export** — Exports selected leads (or all filtered if none selected) to CSV with columns: Customer, Source, Phone, Email, City, Service Type, Priority, Lead Score, Status, Created At.

**Pagination** — Previous/Next buttons, smart page number window (max 7 buttons), results info text ("Showing X–Y of Z leads").

**Empty States** — "No Leads Ingested" when no leads exist and no filters active. "No Leads Match Your Filters" with "Clear All Filters" button when filters produce zero results.

---

## Lead Details

The lead details drawer is a shared client component used by Dashboard, Leads, and CRM pages.

### Data Loading

On open, fetches from Supabase: `lead_events`, `lead_notes`, `appointments`, and `reminders` for the selected lead. Sets up 4 per-lead Realtime channels filtered by `lead_id` to keep data live.

### LEAD_VIEWED Tracking

Inserts a `LEAD_VIEWED` event once per lead per drawer session (deduplicated via ref).

### Drawer Sections

**Header** — Customer name, lead score badge, source, priority badge, status badge, active appointment date indicator.

**Quick Contact Actions** — Phone dial button, copy phone, copy email (if present), open Google Maps (by city).

**Dispatch Notes (Left Column)** — Textarea + submit form to add notes. Note list with inline edit (pencil icon) and delete (trash icon). Notes show relative timestamp. Confirmation dialog for note deletion.

**Follow-up Reminders (Left Column)** — "Add Reminder" toggle reveals form with date, time, priority dropdown, and message input. Reminders list shows message, priority badge, due date/time, status. Pending reminders have a "complete" check button. Completed reminders show strikethrough styling.

**Audit Lead Timeline (Left Column)** — Vertical timeline of lead events with type-specific icons and relative timestamps. Shows "No logged history found" empty state.

**Appointment Reservation (Right Column)** — Status indicator (Scheduled Active or Unscheduled). Active appointment card shows date, time, type, notes, and edit button. "Schedule Appointment Visit" button opens a modal with date/time/type/notes form.

**Intelligence Metrics (Right Column)** — Lead score display (`X/100`) and quality badge (LOW/MEDIUM/HIGH).

**Recommended Routing (Right Column)** — Recommended response time and next logical action from AI analysis.

**Quick CRM Actions (Right Column)** — Context-sensitive buttons: Call Customer (non-terminal only), Mark Contacted (NEW status only), Mark Completed (non-terminal only), Mark Lost (non-terminal only). Confirm dialog for destructive actions.

**Internal Notes (Right Column)** — Disabled textarea and save button (placeholder for future use).

**Footer** — Truncated lead ID display and Close Drawer button.

### Forms

Four React Hook Form instances with Zod resolvers:
- Note form (`noteSchema`: note 2–2000 chars)
- Appointment create form (`appointmentSchema`: date, time, type enum, optional notes max 1000)
- Appointment edit form (`appointmentUpdateSchema`: same fields)
- Reminder form (`reminderSchema`: date, time, priority enum, message 2–500 chars)

---

## CRM

Route: `/crm`

### Data Loading

Server component fetches all `hvac_leads` for the user. Client subscribes to Realtime INSERT/UPDATE/DELETE on `hvac_leads`.

### Kanban Board

5 columns: NEW ("New Ingestion"), CONTACTED ("Contacted"), SCHEDULED ("Scheduled Visit"), COMPLETED ("Job Completed"), LOST ("Lost Deal").

**Drag and Drop** — HTML5 native drag-and-drop. On drop, optimistically updates local state then calls `updateLeadStatusDirectly`. Rolls back on failure.

**Cards** — Each card shows: customer name, lead score badge, phone, city + service type, priority badge, source badge, created date/time. Color-coded column header dots and card count badges.

**Context Menu** — Three-dot button per card reveals dropdown: View Details, Call Customer, Mark Contacted (if NEW), Schedule Visit (if NEW/CONTACTED), Mark Completed (if SCHEDULED), Mark Lost (if not terminal). Inline select checkbox per card.

**Empty Column** — Dashed border drop zone with "Drop lead here" text.

### Filters and Search

Real-time client-side filters (no URL params, unlike Leads page): search by name/phone/email/city/service, filter by priority/city/source/service, sort by newest/oldest/score-desc/score-asc/priority. "Clear Filters" button resets all.

### Bulk Operations

Identical pattern to Leads page: floating toolbar with Contacted/Complete/Lost/Delete actions, confirmation dialog for delete.

---

## Analytics

Route: `/analytics`

### Data Loading

Server component fetches all `hvac_leads` for the user (same ownership filter). Computes all metrics server-side, passes pre-computed data to client.

### KPI Cards (4)

- Total Leads (count)
- Average Lead Score (mean of all lead scores, 0–100 scale)
- Emergency % (percentage with urgency "EMERGENCY")
- Conversion Rate (percentage with status "COMPLETED")

### Charts

**Monthly Lead Trend** — Area chart showing leads aggregated by YYYY-MM, sorted chronologically. Tooltip with styled content.

**Priority Breakdown** — Donut chart with center total. Legend showing each priority with count. Colors: LOW=gray, MEDIUM=blue, HIGH=amber, CRITICAL=red. Shows "No data" when empty.

**Weekly Comparison** — Bar chart comparing current week vs previous week lead counts.

**Emergency Analysis** — Donut chart: emergency vs non-emergency. Shows "No data" when empty.

**Lead Quality** — Donut chart: HIGH/blue, MEDIUM/amber, LOW/gray quality distribution. Shows "No data" when empty.

**Conversion Funnel** — Horizontal bar series for each pipeline stage (NEW → CONTACTED → SCHEDULED → COMPLETED) with arrow connectors between stages.

**Service Type Distribution** — Horizontal bar chart of lead counts by service type. Shows "No service data" when empty.

**City Distribution** — Horizontal bar chart of lead counts by city. Shows "No city data" when empty.

### Empty State

When `totalLeads === 0`, the entire page is replaced with a centered "No Analytics Data" message and bar chart icon.

---

## Profile

Route: `/profile`

### Form Fields

- Full Name (text, required)
- Company Name (text, required)
- Contact Phone (text, placeholder)
- Timezone (dropdown: EST, CST, MST, PST, UTC)
- Country (text)
- Email (read-only, immutable display)

All fields validated server-side and client-side via `profileSchema` (Zod). Success/error banners displayed after submission. Save button shows spinner during submission.

### Server Action

`updateProfile(formData)` — validates with Zod, updates `profiles` table, revalidates `/dashboard` and `/profile` paths.

---

## Settings

Route: `/settings`

### Sections

**Automation Webhook (n8n)** — URL input for n8n webhook endpoint. Payloads dispatched when CRM quick actions are executed.

**Emergency Lead Email Dispatch** — Toggle switch. When enabled, the system dispatches email notifications for high-priority leads. Stored in `profiles.emergency_email_dispatch`.

**Automatic AI Ingestion** — Toggle switch. When enabled, new leads are routed to OpenRouter LLM for analysis. Stored in `profiles.auto_ai_ingestion`.

Success/error banners displayed after submission. Save button shows spinner during submission.

### Server Actions

- `updateSettings(formData)` — delegates to `updateNotificationPreferences`
- `updatePassword(password)` — Supabase Auth `updateUser({ password })` with minimum 8-character validation
- `updateNotificationPreferences(formData)` — updates `emergency_email_dispatch` and `auto_ai_ingestion` in `profiles`, revalidates `/settings`

---

## Error Handling & Edge Cases

### Error Boundary

Root `error.tsx` catches uncaught runtime exceptions within the workspace routes. Displays "Something went wrong" message with Try Again and Return to Dashboard buttons.

### 404

Custom `not-found.tsx` with navigation recovery options: Go Back and Return to Dashboard.

### Empty States

Every data list implements empty state handling:
- Dashboard: No appointments, no reminders, no leads, no events
- Leads: No leads (with/without active filters)
- CRM: No operations found (with filter reset)
- Analytics: No data (full-page empty state)
- Charts: "No data" / "No service data" / "No city data"

### Loading States

- Charts use skeleton placeholders during lazy load
- All submit buttons show `Loader2` spinner during async operations
- Bulk operations show spinner in floating toolbar

### Toast Notifications

Floating toast messages (auto-dismiss 2.5–3 seconds) for success/error feedback on all CRUD operations.

### Confirmation Dialogs

Required for destructive actions: bulk delete, lead completion, lead loss, note deletion.

---

## Database

### Tables

| Table | Key Columns |
|---|---|
| `profiles` | id (FK auth.users), full_name, company_name, phone, timezone, country, role (ADMIN/DISPATCHER/CSR/TECHNICIAN), n8n_webhook_url, emergency_email_dispatch, auto_ai_ingestion |
| `hvac_leads` | customer_name, phone, email, city, service_type, property_type, issue_description, lead_quality, urgency, estimated_job_value, customer_intent, recommended_response_time, service_category, summary, recommended_action, lead_score (0–100), priority (LOW/MEDIUM/HIGH/CRITICAL), status (NEW/CONTACTED/SCHEDULED/COMPLETED/LOST), source |
| `lead_events` | lead_id (FK), event_type (constrained), description, metadata (JSONB), created_by (FK auth.users) |
| `lead_notes` | lead_id (FK), user_id (FK), note |
| `appointments` | lead_id (FK), appointment_date, appointment_time, appointment_type, status (Scheduled/Confirmed/Rescheduled/Completed/Cancelled), notes |
| `reminders` | lead_id (FK), reminder_date, reminder_time, priority (LOW/MEDIUM/HIGH/CRITICAL), message, status (Pending/Completed/Overdue) |

### Triggers

- `handle_updated_at()` — auto-updates `updated_at` on profiles, hvac_leads, appointments, reminders
- `log_lead_creation_event()` — after INSERT on hvac_leads: creates LEAD_CREATED event; creates AI_ANALYZED event if summary is populated
- `log_lead_status_change()` — after UPDATE of status: creates STATUS_CHANGED event with from/to descriptions

### Row-Level Security

All 6 tables have RLS enabled. Policies restrict access by auth user ID and existence of related records.

### Realtime

Tables `hvac_leads`, `lead_events`, `appointments`, `reminders` are published for Realtime subscriptions.

---

## Event Types

Events are stored in `lead_events` with the following types used in the application:

`LEAD_CREATED`, `LEAD_RECEIVED`, `AI_ANALYZED`, `LEAD_VIEWED`, `FIRST_RESPONSE`, `STATUS_CHANGED`, `EMAIL_SENT`, `NOTE_ADDED`, `APPOINTMENT_CREATED`, `APPOINTMENT_COMPLETED`, `LEAD_COMPLETED`, `LEAD_LOST`

Events are created both by database triggers (LEAD_CREATED, STATUS_CHANGED, AI_ANALYZED) and application code (all others).

---

## n8n Workflows

5 production workflows deployed in n8n:

| Workflow | Trigger | Purpose |
|---|---|---|
| `lead-ingestion` | Webhook POST `/webhook/lead-ingestion` | Validate lead data, insert into Supabase, log LEAD_RECEIVED event, trigger AI analysis |
| `ai-lead-analysis` | Webhook POST `/webhook/ai-analysis-trigger` | Fetch lead, send to OpenRouter for scoring/priority/quality/urgency analysis, update lead in Supabase |
| `send-notification` | Webhook POST `/webhook/send-notification` | Send email via SMTP |
| `schedule-appointment` | Webhook POST `/webhook/schedule-appointment` | Insert appointment, update lead status to SCHEDULED, log event |
| `webhook-dispatcher` | Webhook POST `/webhook/webhook-dispatcher` | Central router: dispatches to appropriate workflow based on `action` field |

---

## UI Primitives

Built (though currently unused — all pages render their own inline styling):

- **Card** — Container with border, shadow, configurable padding
- **Badge / StatusBadge / PriorityBadge** — Colored label variants mapped to status/priority enums
- **EmptyState** — Centered layout with icon, title, description, action slot
- **Skeleton / CardSkeleton / KPISkeleton / ChartSkeleton** — Animated loading placeholders

---

## Environment Variables

| Variable | Required | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only |
| `N8N_WEBHOOK_URL` | No | Server only (fallback) |
| `OPENROUTER_API_KEY` | No | Server only (for n8n) |

---

## Status Enums

### Lead Status
`NEW` → `CONTACTED` → `SCHEDULED` → `COMPLETED` | `LOST`

### Lead Priority
`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

### Lead Quality
`LOW` | `MEDIUM` | `HIGH`

### Urgency
`LOW` | `NORMAL` | `HIGH` | `EMERGENCY`

### Customer Intent
`UNKNOWN` | `SHOPPING` | `READY_TO_BUY`
