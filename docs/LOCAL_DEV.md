# Local Development Guide — HVAC AI Lead Intelligence

**Version:** 1.1.0  
**Estimated Setup Time:** 15 minutes

---

## Prerequisites

- **Node.js** 22.x or later
- **npm** 10.x or later
- **Git**
- A **Supabase** account (free tier works)
- An **OpenRouter** API key (free trial available)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/hvac-lead-intelligence.git
cd hvac-lead-intelligence

# 2. Install dependencies
npm install

# 3. Run the setup wizard
npm run setup

# 4. Start development server
npm run dev

# 5. Open browser
open http://localhost:3000
```

---

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd hvac-lead-intelligence
npm install
```

### 2. Configure Environment

Run the interactive setup wizard:

```bash
npm run setup
```

This will prompt for:
- Project name and company name
- Supabase URL and keys (from [supabase.com](https://supabase.com))
- OpenRouter API key (from [openrouter.ai](https://openrouter.ai))
- n8n configuration
- Email provider settings (optional)

The wizard will generate `.env.local` automatically.

Alternatively, copy `.env.example` to `.env.local` and fill in values manually:

```bash
cp .env.example .env.local
```

### 3. Set Up the Database

**Option A: Install everything** (recommended for new projects):
1. Go to Supabase dashboard → **SQL Editor**
2. Open `supabase/install.sql` and copy its contents
3. Paste into SQL Editor and click **Run**

**Option B: Schema only** (if you want to add data later):
1. Run `supabase/scripts/001_schema.sql`
2. Run `supabase/scripts/002_rls.sql`
3. Run `supabase/scripts/003_realtime.sql`

### 4. Configure Branding

```bash
npm run branding
```

Follow the prompts to customize company name, logo, colors, and contact information.

### 5. Validate Environment

```bash
npm run validate
```

This checks:
- All required environment variables are set
- URLs are valid
- API keys look correct
- Project structure is intact

### 6. Verify Build

Before running the dev server, verify the project builds:

```bash
npm run verify-build
```

### 7. Start Development

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Run TypeScript type check |
| `npm run validate` | Validate environment configuration |
| `npm run setup` | Interactive setup wizard |
| `npm run branding` | Configure branding interactively |
| `npm run verify-build` | Run lint, typecheck, and build |

---

## Working with Supabase Locally

### Viewing Data

1. Go to Supabase dashboard → **Table Editor**
2. Browse tables: `hvac_leads`, `lead_events`, `lead_notes`, `appointments`, `reminders`

### Running SQL Queries

1. Go to Supabase dashboard → **SQL Editor**
2. Create a new query
3. Write or paste SQL
4. Click **Run**

### Testing RLS Policies

1. Create a test user via the application sign-up
2. Verify the user can only see authorized data
3. Check `supabase/verify.sql` for RLS validation queries

---

## Working with n8n Locally

### Start n8n

```bash
# Using Docker
docker run -it --name n8n -p 5678:5678 \
  -v n8n-data:/home/node/.n8n \
  n8nio/n8n:latest
```

### Import Workflows

1. Open n8n at [http://localhost:5678](http://localhost:5678)
2. Go to **Workflows** → **Import** → **From File**
3. Import files from `n8n/workflows/`
4. Configure credentials using templates in `n8n/credentials/`
5. Activate workflows

### Expose Webhooks Locally

For n8n to reach your local dev server:

```bash
# Using ngrok
ngrok http 3000
```

Update `N8N_WEBHOOK_URL` in `.env.local` with your ngrok URL.

---

## Common Development Tasks

### Adding a New Lead

```sql
INSERT INTO public.hvac_leads (customer_name, phone, city, service_type, property_type, issue_description, lead_quality, urgency, estimated_job_value, customer_intent, recommended_response_time, service_category, summary, recommended_action, lead_score, priority, status, source)
VALUES ('Test Customer', '5550001111', 'Dallas', 'AC Repair', 'Residential', 'Test issue description for debugging purposes. Must be at least 20 characters long.', 'MEDIUM', 'NORMAL', 'MEDIUM', 'UNKNOWN', 'Within 24 Hours', 'Cooling', 'Test summary for debugging.', 'Review test lead.', 50, 'MEDIUM', 'NEW', 'Manual');
```

### Resetting Demo Data

```bash
-- Run in Supabase SQL Editor:
-- Open supabase/reset.sql and execute
```

### Viewing the Audit Timeline

```sql
SELECT * FROM public.lead_events ORDER BY created_at DESC LIMIT 20;
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm install` fails | Clear node_modules: `rm -rf node_modules && npm install` |
| Build fails with TypeScript errors | Run `npx tsc --noEmit` to see all errors |
| Login error "Invalid login credentials" | Check Supabase Auth settings (enable email/password) |
| Dashboard shows no data | Seed data or create a lead via SQL Editor |
| Charts are empty | At least one lead with data is required |
| "Failed to fetch" in browser | Check NEXT_PUBLIC_SUPABASE_URL in .env.local |
| Port 3000 already in use | `npx next dev -p 3001` |
| n8n webhooks not working | Check n8n is running and webhook URLs match |

---

## Project Structure

```
├── config/              ← Centralized configuration (Sprint 05.1)
├── docs/                ← Documentation
├── n8n/                 ← n8n workflow package (Sprint 05.3)
├── scripts/             ← CLI tools (Sprint 05.4)
├── src/                 ← Application source code
│   ├── app/             ← Next.js App Router pages
│   ├── components/      ← Reusable UI components
│   ├── lib/             ← Utilities, Supabase clients, schemas
│   └── types/           ← TypeScript type definitions
├── supabase/            ← Database installer and seed data (Sprint 05.2)
├── .env.example         ← Environment variable template
├── .env.local           ← Local environment (git-ignored)
├── AGENTS.md            ← Project instructions and tech stack
└── DATABASE_INSTALL.md  ← Database installation guide
```

---

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Vercel Deployment Guide](DEPLOYMENT_VERCEL.md)
- [Database Installation Guide](../DATABASE_INSTALL.md)
- [Configuration Guide](../config/README.md)
- [Production Checklist](PRODUCTION_CHECKLIST.md)
