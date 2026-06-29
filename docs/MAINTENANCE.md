# Maintenance Guide — HVAC AI Lead Intelligence

**Version:** 1.1.0  
**Last Updated:** June 29, 2026

---

## Table of Contents

1. [Updating Dependencies](#1-updating-dependencies)
2. [Database Migrations](#2-database-migrations)
3. [Updating n8n Workflows](#3-updating-n8n-workflows)
4. [Backup Strategy](#4-backup-strategy)
5. [Monitoring](#5-monitoring)
6. [Troubleshooting Common Issues](#6-troubleshooting-common-issues)
7. [Upgrade Process](#7-upgrade-process)
8. [Security Maintenance](#8-security-maintenance)

---

## 1. Updating Dependencies

### Regular Updates

```bash
# Check outdated packages
npm outdated

# Update all patch and minor versions
npm update

# Update specific packages
npm install next@latest react@latest

# After updating, verify everything still works
npm run verify-build
```

### Major Version Updates

When updating major versions (e.g., Next.js 16 → 17):

1. Read the framework's migration guide
2. Create a backup branch: `git checkout -b upgrade-next-17`
3. Update the package: `npm install next@17`
4. Run build verification: `npm run verify-build`
5. Test all features manually
6. Deploy to preview environment first
7. Merge to main after verification

### Lock File Maintenance

```bash
# Regenerate lock file if corrupted
rm package-lock.json
npm install

# Check for vulnerabilities
npm audit
npm audit fix
```

---

## 2. Database Migrations

### Adding a Migration

1. Create a new migration file in `supabase/scripts/`:
   ```sql
   -- supabase/scripts/004_add_customer_preferences.sql
   -- Description: Add preferences column to hvac_leads
   -- Version: 1.2.0
   
   ALTER TABLE public.hvac_leads
   ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
   ```

2. Register in `schema_versions`:
   ```sql
   INSERT INTO public.schema_versions (version, description)
   VALUES ('1.2.0', 'Add customer preferences column to hvac_leads');
   ```

3. Update the master installer:
   ```sql
   -- Add to the end of supabase/install.sql (before the final select)
   \i scripts/004_add_customer_preferences.sql
   ```

### Migration Best Practices

- Always use `IF NOT EXISTS` / `IF EXISTS` for idempotent migrations
- Never delete a column without a deprecation period
- Always add new columns as nullable or with defaults
- Test migrations on a copy of production data first
- Version every migration in `schema_versions`

### Rolling Back

```sql
-- If a migration causes issues, reverse it:
ALTER TABLE public.hvac_leads DROP COLUMN IF EXISTS preferences;

-- Note the rollback in schema_versions:
INSERT INTO public.schema_versions (version, description)
VALUES ('1.2.0-rollback', 'Reverted: Add customer preferences column');
```

---

## 3. Updating n8n Workflows

### Exporting Updated Workflows

1. In n8n, open the workflow
2. Click **Workflow** → **Export** → **Download JSON**
3. Save to `n8n/workflows/` with the correct filename
4. Update the `metadata.version` field in the JSON

### Adding a New Workflow

1. Build the workflow in n8n
2. Export as JSON
3. Save to `n8n/workflows/`
4. Update `n8n/README.md` workflow reference table
5. Update `n8n/webhooks/webhook-config.md` with new endpoint info

### Updating Credentials

- Never export credentials with real values
- Always use `$env.VARIABLE_NAME` syntax
- Update credential templates in `n8n/credentials/` if structure changes

---

## 4. Backup Strategy

### Supabase Backups

| Plan | Backup Frequency | Retention |
|------|-----------------|-----------|
| **Free** | Daily | 7 days |
| **Pro** | Daily + Point-in-time | 7 days + 24 hours PITR |
| **Team** | Daily + Point-in-time | 14 days + 24 hours PITR |

### Manual Backup

```bash
# Export database via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Or use pg_dump directly
pg_dump --dbname=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres > backup.sql
```

### Configuration Backup

Your configuration is in version control:
- `.env.example` — template (committed)
- `.env.local` — actual values (NOT committed, back up separately)
- `config/` — all configuration files (committed)

### Backup Checklist

- [ ] Database backups are automated (Supabase handles this)
- [ ] `.env.local` is backed up securely (password manager)
- [ ] n8n workflow exports are in version control
- [ ] GitHub repository is private and backed up

---

## 5. Monitoring

### Application Monitoring

| Tool | Purpose | Setup |
|------|---------|-------|
| Vercel Analytics | Page views, performance | Built-in |
| Supabase Dashboard | Database health | Built-in |
| n8n Execution Log | Workflow success/failure | Built-in |

### What to Monitor

- **Error rates**: 500 errors, unhandled exceptions
- **Response times**: Slow pages or API calls
- **Database performance**: Slow queries, connection pool
- **n8n executions**: Failed workflows, retry counts
- **Auth failures**: Failed login attempts
- **AI analysis**: OpenRouter API response times and errors

### Health Check Endpoints

```bash
# Application is running
curl https://your-app.vercel.app

# Database connectivity (check via application)
# Login to the app and verify data loads
```

---

## 6. Troubleshooting Common Issues

### Application Issues

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Login fails | Supabase Auth misconfigured | Check Auth settings in Supabase dashboard |
| Dashboard shows no data | No leads in database | Seed data: `supabase/seed/seed.sql` |
| Charts not rendering | Empty dataset | Charts require at least one lead |
| Page loads slowly | Large dataset without pagination | Check indexes in verify.sql |
| Client-side error | Missing env variable | Run `npm run validate` |

### Database Issues

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| RLS policy violation | Policy missing or wrong | Run `supabase/scripts/002_rls.sql` |
| Foreign key error | Wrong insert order | Check child tables are inserted after parents |
| Trigger not firing | Trigger not created | Run `supabase/scripts/001_schema.sql` |
| Realtime not updating | Table not in publication | Run `supabase/scripts/003_realtime.sql` |
| Query slow | Missing index | Check indexes in verify.sql |

### n8n Issues

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Webhook not triggering | Wrong URL or n8n not running | Check n8n status and webhook URL |
| AI analysis fails | Invalid OpenRouter key | Verify key in n8n credentials |
| Email not sending | SMTP credentials wrong | Test SMTP connection |
| Supabase insert fails | Service role key missing | Check SUPABASE_SERVICE_KEY env var |
| Workflow execution slow | AI API latency | Check OpenRouter status |

### Build Issues

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| TypeScript errors | Type mismatch | Run `npx tsc --noEmit` to see all errors |
| Lint errors | Code style violation | Run `npm run lint` and fix |
| Build fails | Missing module | Run `npm install` |
| Vercel deploy fails | Missing env var | Check Vercel environment variables |

---

## 7. Upgrade Process

### Minor Upgrade (e.g., 1.1.0 → 1.2.0)

1. Review changes in the new version
2. Create upgrade branch: `git checkout -b upgrade-1.2.0`
3. Update code and configuration
4. Run migration script if database changes
5. Run `npm run verify-build`
6. Deploy to preview environment
7. Test all features
8. Merge to main and deploy to production

### Major Upgrade (e.g., 1.x → 2.x)

1. Review all breaking changes
2. Create detailed upgrade plan
3. Set up a staging environment
4. Run database migrations
5. Update application code
6. Full integration testing
7. Performance testing
8. Security review
9. Schedule production deployment (off-peak hours)
10. Have rollback plan ready

### Rollback Plan

```bash
# 1. Revert code
git revert <deployment-commit>
git push

# 2. Revert database
# Run rollback SQL for any migrations

# 3. Re-deploy previous version
# Vercel: Select previous deployment and promote
```

---

## 8. Security Maintenance

### Regular Tasks

- [ ] Monthly: Review Supabase Auth logs for suspicious activity
- [ ] Monthly: Check for outdated dependencies (`npm outdated`)
- [ ] Quarterly: Review RLS policies for correctness
- [ ] Quarterly: Rotate API keys (OpenRouter, Supabase service key)
- [ ] Quarterly: Review access logs
- [ ] Annually: Full security audit

### Key Rotation

```bash
# 1. Generate new key
# 2. Update in .env.local
# 3. Update in Vercel environment variables
# 4. Update in n8n credentials
# 5. Test thoroughly
# 6. Revoke old key
```

### Vulnerability Response

1. **Identify**: Run `npm audit` regularly
2. **Assess**: Determine severity and impact
3. **Patch**: Update affected packages
4. **Verify**: Run full test suite and build
5. **Deploy**: Push fix to production
6. **Document**: Note the vulnerability and resolution

---

## Related Documentation

- [Production Checklist](PRODUCTION_CHECKLIST.md)
- [Deployment Guide](DEPLOYMENT_VERCEL.md)
- [Local Development](LOCAL_DEV.md)
- [Database Installation](../DATABASE_INSTALL.md)
- [Architecture Overview](ARCHITECTURE.md)
