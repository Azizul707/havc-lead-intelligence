# n8n Workflow Package — AI Lead Scoring CRM

**Version:** 1.1.0  
**Purpose:** Production-ready automation workflows for HVAC client deployments

This package contains all n8n workflows, credential templates, and documentation needed to set up automated lead processing, AI analysis, notifications, and integrations.

---

## Directory Structure

```
n8n/
├── README.md                    ← This file
├── workflows/
│   ├── lead-ingestion.json      ← Webhook receiver for new leads
│   ├── ai-lead-analysis.json    ← OpenRouter AI qualification
│   ├── send-notification.json   ← Email/SMS notifications
│   ├── schedule-appointment.json ← Appointment booking automation
│   └── webhook-dispatcher.json  ← Generic webhook dispatcher
├── credentials/
│   ├── openrouter-api.json      ← Credential template (placeholder)
│   ├── supabase-api.json        ← Credential template (placeholder)
│   └── smtp-provider.json       ← Credential template (placeholder)
├── webhooks/
│   └── webhook-config.md        ← Webhook documentation
└── templates/
    └── sample-workflow.json     ← Workflow template for custom automations
```

---

## Quick Start

### 1. Install n8n

```bash
# Using Docker (recommended)
docker run -it --name n8n -p 5678:5678 \
  -v n8n-data:/home/node/.n8n \
  n8nio/n8n:latest

# Or using npm
npm install n8n -g
n8n start
```

### 2. Import Workflows

1. Open n8n at `http://localhost:5678`
2. Go to **Workflows** → **Import**
3. Import each workflow from `n8n/workflows/` in this order:
   - `lead-ingestion.json`
   - `ai-lead-analysis.json`
   - `send-notification.json`
   - `schedule-appointment.json`
   - `webhook-dispatcher.json`

### 3. Configure Credentials

1. Go to **Credentials** in n8n
2. Create new credentials using templates from `n8n/credentials/`
3. Fill in actual API keys and connection strings

### 4. Configure Webhooks

Update webhook URLs in workflows to point to your client's Supabase project.

---

## Workflow Reference

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `lead-ingestion` | Receives leads from n8n webhook | Webhook |
| `ai-lead-analysis` | Analyzes leads with OpenRouter AI | Manual/Triggered |
| `send-notification` | Sends email/SMS notifications | Manual/Triggered |
| `schedule-appointment` | Books technician appointments | Manual/Triggered |
| `webhook-dispatcher` | Generic webhook for external integrations | Manual/Triggered |

---

## Environment Variables

Workflows use these environment variables (configure in n8n or via environment):

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `OPENROUTER_API_KEY` | AI API key | `sk-or-...` |
| `SMTP_HOST` | Email provider host | `smtp.sendgrid.net` |
| `SMTP_USER` | Email username | `apikey` |
| `SMTP_PASS` | Email password/key | `SG.xxx` |
| `WEBHOOK_BASE_URL` | Application base URL | `https://client.example.com` |

---

## Webhook Configuration

See `webhooks/webhook-config.md` for:
- Webhook endpoint URLs
- Expected payload schemas
- Authentication requirements
- Retry behavior

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow not triggering | Check webhook URL matches n8n workflow |
| AI analysis fails | Verify OpenRouter API key in credentials |
| Email not sending | Check SMTP credentials and provider settings |
| Database errors | Verify Supabase URL and keys are correct |

---

## Support

For issues or questions, contact the development team or refer to the main documentation at `DATABASE_INSTALL.md`.

---

*Last updated: June 29, 2026*