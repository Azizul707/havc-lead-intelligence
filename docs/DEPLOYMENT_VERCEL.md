# Vercel Deployment Guide — HVAC AI Lead Intelligence

**Version:** 1.1.0  
**Estimated Time:** 20 minutes

---

## Prerequisites

Before deploying, ensure you have:

- [ ] A GitHub account with the repository pushed
- [ ] A Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] A Supabase project (see [DATABASE_INSTALL.md](../DATABASE_INSTALL.md))
- [ ] An OpenRouter API key
- [ ] n8n instance configured (optional for initial deploy)

---

## Step 1: Push to GitHub

```bash
# Initialize (if not already done)
git init
git add .
git commit -m "Initial deployment"

# Create a GitHub repository and push
git remote add origin https://github.com/your-org/your-client-repo.git
git branch -M main
git push -u origin main
```

---

## Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Vercel will auto-detect Next.js configuration

---

## Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Required Variables

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key) | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key) | Supabase → Project Settings → API |
| `OPENROUTER_API_KEY` | `sk-or-...` | [OpenRouter Dashboard](https://openrouter.ai/settings) |

### Optional Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `N8N_URL` | `http://localhost:5678` | n8n webhook URL |
| `N8N_WEBHOOK_URL` | `https://your-n8n.ngrok.io/webhook` | Public n8n webhook URL |
| `SMTP_HOST` | `smtp.sendgrid.net` | Email provider host |
| `SMTP_PORT` | `587` | Email provider port |
| `SMTP_USER` | `apikey` | Email username |
| `SMTP_PASS` | `SG.xxx` | Email password/key |
| `SMTP_FROM_EMAIL` | `notifications@yourcompany.com` | Sender email |

### Branding Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `BRANDING_CONFIG` | `{"companyName":"Your Co"}` | Override branding via JSON |
| `CLIENT_CONFIG` | `{"timeZone":"America/New_York"}` | Override client settings |

### Add Variables in Vercel

1. In your project dashboard, go to **Settings** → **Environment Variables**
2. Add each variable with its key and value
3. Set scope to **Production** (and Preview/Development if needed)

---

## Step 4: Configure Build Settings

Vercel auto-detects Next.js. Verify these settings:

| Setting | Value |
|---------|-------|
| **Framework** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Node.js Version** | 22.x (or latest LTS) |

---

## Step 5: Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a URL like: `https://your-project.vercel.app`

---

## Step 6: Verify Deployment

Run these checks after deployment:

### Application Health

- [ ] Visit `https://your-project.vercel.app/login` — Login page loads
- [ ] Sign up with email/password — Authentication works
- [ ] Login to dashboard — Dashboard loads without errors
- [ ] Navigate to Leads page — Leads load (if seeded)
- [ ] Navigate to Analytics — Charts render
- [ ] Navigate to CRM — Board loads
- [ ] Navigate to Settings — Settings page works
- [ ] Navigate to Profile — Profile page works
- [ ] Logout works correctly

### Database Connectivity

- [ ] Leads appear on the dashboard (if seeded)
- [ ] Lead details drawer opens on click
- [ ] Status changes update the database
- [ ] New appointments can be created

---

## Step 7: Configure Custom Domain (Optional)

1. In Vercel project dashboard, go to **Settings** → **Domains**
2. Enter your custom domain (e.g., `app.yourcompany.com`)
3. Follow Vercel's DNS configuration instructions
4. Wait for SSL certificate provisioning (~5 minutes)

---

## Step 8: Configure n8n Webhooks

Once deployed, update n8n webhook URLs to point to your production instance:

1. In n8n, open each workflow
2. Update webhook nodes to use your Vercel URL:
   - `https://your-project.vercel.app/api/webhook/lead-ingestion`
3. Activate the workflows

---

## Post-Deployment Checklist

- [ ] HTTPS is enforced (Vercel provides this automatically)
- [ ] Custom domain has valid SSL certificate
- [ ] Environment variables are set for Production
- [ ] Database RLS policies are active
- [ ] n8n workflows are activated
- [ ] Monitoring is set up (Vercel Analytics, Sentry, etc.)
- [ ] Backups are configured (Supabase project has automatic backups)

---

## Troubleshooting

### Build Fails

| Error | Solution |
|-------|----------|
| Missing environment variable | Check all required vars are set in Vercel |
| TypeScript error | Run `npx tsc --noEmit` locally to find the issue |
| Module not found | Run `npm install` locally and commit `package-lock.json` |

### Runtime Errors

| Error | Solution |
|-------|----------|
| "Failed to fetch" | Check Supabase URL and anon key in environment variables |
| "Permission denied" | Check RLS policies in Supabase |
| Login not working | Verify Supabase Auth is configured (email/password enabled) |
| API route returns 500 | Check server-side environment variables (service role key) |

### Database Issues

| Error | Solution |
|-------|----------|
| No data visible | Run `supabase/verify.sql` to check tables and seed data |
| RLS errors | Run `supabase/scripts/002_rls.sql` to reapply policies |
| Missing tables | Run `supabase/install.sql` to recreate schema |

---

## Related Guides

- [Local Development Guide](LOCAL_DEV.md)
- [Database Installation Guide](../DATABASE_INSTALL.md)
- [Production Checklist](PRODUCTION_CHECKLIST.md)
- [Maintenance Guide](MAINTENANCE.md)
