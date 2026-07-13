# AI Lead Scoring CRM

**Production-grade AI-powered CRM for HVAC and local service businesses in the United States, Canada, and Australia.**

Automatically score, prioritize, and manage every customer inquiry from one intelligent workspace. Receive leads from n8n, store them in Supabase, display them in a professional dashboard, and provide AI-powered lead qualification — all in a deployable template that can be set up for a new client in under one hour.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the interactive setup wizard
npm run setup

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## Deployment Overview

Each client gets their own isolated deployment:

| Component | How |
|-----------|-----|
| **GitHub Repository** | Clone this template → push to client repo |
| **Database** | New Supabase project → run `supabase/install.sql` |
| **AI** | OpenRouter API key → configure in environment |
| **Automation** | New n8n instance → import `n8n/workflows/` |
| **Hosting** | Vercel project → configure environment → deploy |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth (email/password) |
| AI | OpenRouter API (via n8n) |
| Automation | n8n workflows |
| Hosting | Vercel |
| Charts | Recharts |
| Tables | TanStack Table |

---

## Project Structure

```
├── config/              ← Centralized configuration (branding, client, env)
├── docs/                ← Architecture, deployment, maintenance guides
├── n8n/                 ← n8n workflow package (importable JSON)
├── scripts/             ← CLI tools (setup, validate, branding wizard)
├── src/                 ← Application source code
│   ├── app/             ← Next.js App Router pages
│   ├── components/      ← Reusable UI components
│   ├── lib/             ← Utilities, Supabase clients, schemas
│   └── types/           ← TypeScript type definitions
├── supabase/            ← Database installer, seed data, verification
├── .env.example         ← Environment variable template
├── AGENTS.md            ← Project specifications and requirements
└── DATABASE_INSTALL.md  ← Database setup guide
```

---

## Features

### Dashboard
- Total leads, today's leads, critical/high priority counts
- Lead score averages and response time tracking
- Charts: leads by day, priority distribution, service type, job value
- Real-time activity feed and recent leads table

### Lead Management
- Server-side paginated lead table
- Search, filter, sort across all lead fields
- CSV export for selected leads
- AI-powered lead scoring and priority assignment
- Detailed lead view with customer info, AI summary, and timeline

### CRM Board
- Kanban-style pipeline management
- Drag-and-drop status updates
- Quick actions: call, contact, schedule, complete
- Bulk operations: status updates and deletions

### Analytics
- Daily/weekly/monthly lead trends
- Geographic distribution by city
- Service type breakdown
- Priority and lead quality analysis

### AI Intelligence
- OpenRouter-powered lead analysis
- Automatic lead scoring (0–100)
- Priority classification (LOW → CRITICAL)
- Customer intent detection
- Summary and recommended actions

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup` | Interactive configuration wizard |
| `npm run validate` | Validate environment configuration |
| `npm run branding` | Configure company branding |
| `npm run verify-build` | Run lint + typecheck + build |

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Architecture Overview](docs/ARCHITECTURE.md) | System architecture and data flow |
| [Local Development](docs/LOCAL_DEV.md) | Setup and run locally |
| [Vercel Deployment](docs/DEPLOYMENT_VERCEL.md) | Deploy to production |
| [Database Installation](DATABASE_INSTALL.md) | Set up Supabase database |
| [Configuration Guide](config/README.md) | Branding, client, and env config |
| [Production Checklist](docs/PRODUCTION_CHECKLIST.md) | Go-live verification |
| [Maintenance Guide](docs/MAINTENANCE.md) | Ongoing maintenance |

---

## Sprint History

| Sprint | Deliverable |
|--------|-------------|
| **01** | Core application setup, authentication, routing |
| **02** | Dashboard, charts, real-time data |
| **03** | Lead management, CRM board, dispatcher operations |
| **04** | Analytics, settings, profile, project hardening |
| **05.1** | Centralized configuration system |
| **05.2** | Database installer, seed data, verification |
| **05.3** | n8n workflow package, webhook configuration |
| **05.4** | Setup wizard, deployment scripts, documentation |

---

## License

Private — Commercial use. All rights reserved.

---

*Built with Next.js 16, Supabase, and n8n — AI Lead Scoring CRM*
