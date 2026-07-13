# Production Deployment Checklist — AI Lead Scoring CRM

**Version:** 1.1.0  
**Use this checklist before going live with a new client deployment.**

---

## ⚡ Pre-Deployment

### Environment Configuration

- [ ] `.env.local` or Vercel environment variables contain all required values
- [ ] `NEXT_PUBLIC_SUPABASE_URL` points to production Supabase project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (server-side only)
- [ ] `OPENROUTER_API_KEY` is set and valid
- [ ] All placeholder values have been replaced
- [ ] No secrets are exposed in client-side code

### Database

- [ ] Supabase project is created in the correct region
- [ ] Master installer (`supabase/install.sql`) ran successfully
- [ ] Verification script (`supabase/verify.sql`) passes all checks
- [ ] RLS policies are active on all tables
- [ ] Indexes are created for performance
- [ ] Realtime publication includes required tables
- [ ] Database backups are enabled (Supabase Pro plan)
- [ ] Point-in-time recovery is configured (if available)
- [ ] Demo data has been reset for production (`supabase/reset.sql`)

### Authentication

- [ ] Supabase Auth is configured with email/password
- [ ] Email confirmation is enabled (recommended)
- [ ] Password policy is configured (min 8 chars, mixed case)
- [ ] Session timeout is configured
- [ ] Redirect URLs are set correctly in Supabase Auth settings
- [ ] Test user accounts work correctly

---

## 🔧 Build & Deploy

### Pre-Build Checks

- [ ] `npm run lint` passes with zero errors
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes successfully
- [ ] `npm run validate` passes all checks
- [ ] All environment variables are set in Vercel dashboard
- [ ] Git branch is `main` (or production branch)

### Vercel Deployment

- [ ] Project is imported to Vercel
- [ ] Build command is set to `npm run build`
- [ ] Node.js version is 22.x (or latest LTS)
- [ ] Environment variables are configured in Vercel
- [ ] Deployment completes without errors
- [ ] Preview deployment works (if used)

### Domain & SSL

- [ ] Custom domain is configured (if using one)
- [ ] SSL certificate is active (Vercel provides this)
- [ ] DNS records are properly configured
- [ ] `www` redirect is configured (optional)
- [ ] Domain verification is complete

---

## ✅ Post-Deployment Verification

### Application

- [ ] Login page loads at production URL
- [ ] User can sign up and log in
- [ ] Dashboard loads with correct data
- [ ] Leads page displays seeded leads (or empty state)
- [ ] Lead details drawer opens on click
- [ ] CRM Board loads with correct columns
- [ ] Analytics page renders charts
- [ ] Settings page loads and saves
- [ ] Profile page loads and user info is correct
- [ ] 404 page shows for unknown routes
- [ ] Logout works and redirects to login
- [ ] Mobile responsive layout works

### API & Database

- [ ] Supabase API is reachable
- [ ] Database queries return expected results
- [ ] RLS policies do not block legitimate access
- [ ] Server actions execute without errors
- [ ] Realtime subscriptions work (dashboard updates live)

### AI Integration

- [ ] OpenRouter API key is valid
- [ ] n8n AI analysis workflow is active
- [ ] AI analysis runs and updates lead scores
- [ ] AI responses are parsed correctly

### n8n Integration

- [ ] n8n instance is running
- [ ] All workflows are imported
- [ ] Credentials are configured (via environment variables)
- [ ] Webhook URLs point to production endpoints
- [ ] Workflows are activated
- [ ] Test lead ingestion works end-to-end
- [ ] Error paths are tested (invalid payload, missing fields)

### Email (if configured)

- [ ] SMTP credentials are valid
- [ ] Test email sends successfully
- [ ] Email notifications are triggered correctly
- [ ] Spam score is acceptable

---

## 🔒 Security Checklist

- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] RLS policies are active on all tables
- [ ] Service role key is never exposed to client
- [ ] API keys are in environment variables, not code
- [ ] Input validation (Zod) is used on all forms
- [ ] SQL injection protection (via Supabase client)
- [ ] XSS protection (React auto-escapes)
- [ ] CORS is configured appropriately
- [ ] Supabase Auth rate limiting is enabled
- [ ] Password policy enforces minimum requirements
- [ ] Session management is configured

---

## 📊 Monitoring & Logging

- [ ] Vercel Analytics is enabled (or alternative)
- [ ] Application logging is configured
- [ ] Error tracking is set up (Sentry or similar)
- [ ] Database monitoring is active (Supabase)
- [ ] n8n execution logging is enabled
- [ ] Performance monitoring is configured
- [ ] Uptime monitoring is configured (optional)
- [ ] Backup monitoring is configured

---

## 🔄 Maintenance

- [ ] Backup strategy is documented
- [ ] Restore process is tested
- [ ] Upgrade process is documented
- [ ] Dependency update schedule is defined
- [ ] Security patch process is defined
- [ ] Contact information for support is documented

---

## 📋 Final Sign-Off

- [ ] All checklist items above are verified
- [ ] Client has confirmed acceptance
- [ ] Stakeholders have been notified
- [ ] Launch date/time is confirmed
- [ ] Rollback plan is documented
- [ ] Support contact is established

---

## Quick Reference

```bash
# Validate environment
npm run validate

# Verify build
npm run verify-build

# Run database verification
# Open supabase/verify.sql in Supabase SQL Editor

# Check database version
# Open supabase/version.sql in Supabase SQL Editor
```

---

## Related Documentation

- [Deployment Guide](DEPLOYMENT_VERCEL.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Maintenance Guide](MAINTENANCE.md)
- [Database Installation Guide](../DATABASE_INSTALL.md)
