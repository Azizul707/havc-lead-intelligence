# Configuration Guide

This directory contains the centralized configuration system for the HVAC Lead Intelligence Platform. All application settings, branding, environment variables, and feature flags are managed here to support easy client deployment and customization.

## Overview

The configuration system is organized into four core modules:
- `brandingConfig.ts`: Company branding and visual settings
- `clientConfig.ts`: Client-specific settings like time zone, currency, and business hours
- `constants.ts`: Centralized constants like status enums and API URLs
- `envConfig.ts`: Environment variables and deployment configuration

## Configuration Usage

Import configuration modules from the `config` folder:

```typescript
import { brandingConfig } from './config/brandingConfig';
import { clientConfig } from './config/clientConfig';
import { ApplicationURLs } from './config/constants';
import { ENV_CONFIG } from './config/envConfig';
```

## Configuration Documentation

### 1. Branding Configuration

The branding configuration controls the visual identity of the application. All branding settings must be customized per client.

**Required Fields:**
- `companyName`: Business name displayed in the application header
- `companyLogo`: URL to the company logo (recommended format: PNG, SVG)
- `companyEmail`: Contact email address
- `companyPhone`: Primary phone number
- `companyAddress`: Company address
- `website`: Company website URL
- `primaryColor`: Main brand color in hex format (e.g., #2563eb)
- `secondaryColor`: Secondary brand color in hex format
- `accentColor`: Accent color for highlights and CTAs
- `favicon`: URL to the app favicon
- `applicationName`: Display name of the application

**Customization:**
Update `brandingConfig.ts` or set `BRANDING_CONFIG` environment variable:

```bash
BRANDING_CONFIG='{"companyName": "Your Company"}'
```

### 2. Client Configuration

Client configuration contains deployment-specific settings.

**Required Fields:**
- `companyName`: Displayed in user profile (can be overridden)
- `timeZone`: IANA timezone (e.g., "America/New_York")
- `currency`: ISO currency code (USD, CAD, AUD)
- `dateFormat`: Date format string (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- `locale`: Locale for UI localization (en-US, en-CA, en-AU)
- `businessHours.start`: Business start time (HH:MM 24-hour format)
- `businessHours.end`: Business end time (HH:MM 24-hour format)
- `contactInformation.email`: Client contact email
- `contactInformation.phone`: Client phone number
- `contactInformation.address`: Client address

**Customization:**
Set `CLIENT_CONFIG` environment variable as JSON:

```bash
CLIENT_CONFIG='{"companyName": "Client Company", "timeZone": "America/Toronto"}'
```

### 3. Environment Configuration

Environment variables for deployment and external services.

**Required Variables:**
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anonymous key
- `OPENROUTER_API_KEY`: AI service API key
- `N8N_URL`: n8n workflow engine URL
- `N8N_USERNAME`: n8n username
- `N8N_PASSWORD`: n8n password

**Optional Variables:**
- `VERCEL_URL`: Custom domain (if using Vercel)
- `VERCEL_TEAM_ID`: Vercel team ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### 4. Feature Flags

Feature flags control which application features are enabled. Currently supports:

- `AI_SUMMARY`: Enable AI-powered lead analysis
- `DISPATCHER`: Enable dispatcher features
- `CRM`: Enable CRM functionality
- `ANALYTICS`: Enable analytics dashboard
- `NOTIFICATIONS`: Enable notification system

Features should be enabled through configuration without modifying application code. Set `FEATURE_FLAGS` environment variable:

```bash
FEATURE_FLAGS='{"AI_SUMMARY": true, "DISPATCHER": false}'
```

### 5. Deployment Constants

Centralized constants include:

- **Status Enums:** LeadStatus, AppointmentStatus, etc.
- **Notification Types:** ReminderType, NotificationType
- **Application URLs:** All route paths (e.g., ApplicationURLs.DASHBOARD)
- **Configuration Keys:** All possible configuration field names

## Configuration Validation

All configuration follows Zod schemas for type safety and validation:

```typescript
import { z } from 'zod';

const BrandConfigSchema = z.object({
  companyName: z.string().min(1),
  companyLogo: z.string().url(),
  // ... additional fields
});
```

Invalid configuration will throw runtime errors.

## Setup for New Client

1. Clone this template repository
2. Create `.env.local` from `.env.example`
3. Set client-specific branding and configuration
4. Configure Supabase project, OpenRouter API key, and n8n workflow
5. Deploy to Vercel
6. Configure custom domain (optional)

## Configuration Files

- `brandingConfig.ts`: Default branding configuration
- `clientConfig.ts`: Default client configuration
- `constants.ts`: All constants and enums
- `envConfig.ts`: Default environment configuration

## Environment Variables File Template

Create `.env.example` with all required variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your_supabase_anonymous_key

# AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# n8n Configuration
N8N_URL=http://localhost:5678
N8N_USERNAME=admin
N8N_PASSWORD=your_n8n_password

# Configuration Overrides
BRANDING_CONFIG={
  "companyName": "Your Company",
  "companyLogo": "https://example.com/logo.png"
}

CLIENT_CONFIG={
  "timeZone": "America/New_York",
  "currency": "USD"
}

# Vercel Configuration (optional)
VERCEL_URL=https://your-app.vercel.app
VERCEL_TEAM_ID=your_team_id
VERCEL_PROJECT_ID=your_project_id
```

## Migration Guide

When upgrading from a previous version:

1. Copy new configuration files to your project
2. Review `.env.example` for all required variables
3. Update branding and client settings as needed
4. Ensure no hardcoded values remain in application code
5. Run `npm run lint && npm run typecheck && npm run build`

## Troubleshooting

**Common Issues:**

1. **Configuration Validation Errors**
   - Ensure all required fields are present
   - Check JSON syntax for complex configuration values
   - Verify URL formats for logo and favicon

2. **TypeScript Errors**
   - Run `npm run typecheck` to identify issues
   - Ensure all configuration modules are imported correctly

3. **Environment Variables Not Loaded**
   - Check that `.env.local` is in the project root
   - Verify variable names match configuration expectations
   - Restart development server after changes

## Testing Configuration

```bash
# Run validation and type checking
npm run lint && npm run typecheck

# Test build with current configuration
npm run build
```

## Support

For configuration-related issues, contact the development team or refer to the documentation for specific module setup instructions.

---

This configuration system makes it easy to deploy the same application codebase to multiple HVAC clients with minimal setup time - typically under one hour as specified in Sprint 05.1 objectives.

_Last updated: June 29, 2026_