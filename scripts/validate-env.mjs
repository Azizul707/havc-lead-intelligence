#!/usr/bin/env node

// =============================================================================
// AI Lead Scoring CRM — Environment Validation CLI
// Checks required environment variables, validates format, and tests
// connectivity where possible.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
let warnings = 0;

function check(label, condition, helpMsg) {
  if (condition) {
    console.log(`  ${GREEN}✔${RESET} ${label}`);
    passed++;
  } else {
    console.log(`  ${RED}✘${RESET} ${label}`);
    if (helpMsg) console.log(`     ${GRAY}${helpMsg}${RESET}`);
    failed++;
  }
}

function warn(label, helpMsg) {
  console.log(`  ${YELLOW}⚠${RESET} ${label}`);
  if (helpMsg) console.log(`     ${GRAY}${helpMsg}${RESET}`);
  warnings++;
}

function section(title) {
  console.log(`\n${BOLD}${title}${RESET}`);
  console.log(`  ${GRAY}${'─'.repeat(50)}${RESET}`);
}

// ──────────────────────────────────────────────
// Load Environment
// ──────────────────────────────────────────────
function loadEnv() {
  const envPaths = [
    join(root, '.env.local'),
    join(root, '.env'),
  ];

  for (const p of envPaths) {
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf-8');
      const vars = {};
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (key) vars[key] = value;
      }
      return { path: p, vars };
    }
  }
  return null;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}Environment Validation${RESET}`);
  console.log(`${GRAY}Checking configuration for AI Lead Scoring CRM${RESET}\n`);

  // 1. Environment file
  section('1. Environment File');
  const env = loadEnv();
  check('Environment file found', env !== null,
    'Create .env.local from .env.example or run: npm run setup');

  if (!env) {
    console.log(`\n${RED}✘ Environment file required to continue.${RESET}`);
    process.exit(1);
  }

  console.log(`  ${GRAY}Loaded from: ${env.path}${RESET}`);

  const V = env.vars;

  // 2. Supabase
  section('2. Supabase Configuration');
  check('NEXT_PUBLIC_SUPABASE_URL is set', !!V.NEXT_PUBLIC_SUPABASE_URL,
    'Required for database connectivity');
  if (V.NEXT_PUBLIC_SUPABASE_URL) {
    check('Supabase URL format is valid',
      V.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
      V.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co'),
      'Should look like: https://your-project.supabase.co');
  }
  check('NEXT_PUBLIC_SUPABASE_ANON_KEY is set', !!V.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Required for client-side Supabase access');
  if (V.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    check('Anon key looks valid (starts with eyJ)',
      V.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ'),
      'Supabase anon keys are JWT tokens starting with eyJ');
  }
  check('SUPABASE_SERVICE_ROLE_KEY is set', !!V.SUPABASE_SERVICE_ROLE_KEY,
    'Required for server-side operations');

  // 3. OpenRouter
  section('3. OpenRouter AI');
  check('OPENROUTER_API_KEY is set', !!V.OPENROUTER_API_KEY,
    'Required for AI lead analysis');
  if (V.OPENROUTER_API_KEY) {
    check('OpenRouter key format looks valid',
      V.OPENROUTER_API_KEY.startsWith('sk-or-') || V.OPENROUTER_API_KEY.length > 20,
      'OpenRouter keys typically start with "sk-or-"');
  }

  // 4. n8n
  section('4. n8n Workflow Automation');
  check('N8N_URL is set', !!V.N8N_URL,
    'Required for workflow integration');
  if (V.N8N_URL) {
    check('N8N_URL format is valid',
      V.N8N_URL.startsWith('http'),
      'Should start with http:// or https://');
  }
  if (V.N8N_WEBHOOK_URL) {
    check('N8N_WEBHOOK_URL is set', true, 'Ensure this matches your n8n webhook endpoint');
  } else {
    warn('N8N_WEBHOOK_URL not set', 'Optional but recommended for webhook integration');
  }

  // 5. Email
  section('5. Email Provider (Optional)');
  if (V.SMTP_HOST || V.SMTP_USER || V.SMTP_PASS) {
    check('SMTP_HOST is set when email is configured', !!V.SMTP_HOST);
    check('SMTP_USER is set', !!V.SMTP_USER);
    check('SMTP_PASS is set', !!V.SMTP_PASS);
    check('SMTP_FROM_EMAIL is set', !!V.SMTP_FROM_EMAIL);
  } else {
    console.log(`  ${GRAY}  Email not configured — skip if not needed${RESET}`);
  }

  // 6. Application
  section('6. Application Configuration');
  check('NEXT_PUBLIC_APP_URL is set', !!V.NEXT_PUBLIC_APP_URL,
    'Used for webhook URLs and redirects');

  // 7. Project config
  section('7. Project Configuration');
  check('config/ directory exists', existsSync(join(root, 'config', 'index.ts')),
    'Run from project root');
  check('install.sql exists', existsSync(join(root, 'supabase', 'install.sql')),
    'Database installer is required');
  check('n8n workflows exist', existsSync(join(root, 'n8n', 'workflows')),
    'n8n package should be present');

  // ── Summary ──
  console.log(`\n${BOLD}${'═'.repeat(50)}${RESET}`);
  console.log(`${BOLD}Results:${RESET}`);
  console.log(`  ${GREEN}✔ Passed: ${passed}${RESET}`);
  if (warnings > 0) console.log(`  ${YELLOW}⚠ Warnings: ${warnings}${RESET}`);
  if (failed > 0) console.log(`  ${RED}✘ Failed: ${failed}${RESET}`);

  if (failed > 0) {
    console.log(`\n${YELLOW}⚠ Some checks failed. Review the items above.${RESET}`);
    console.log(`  Run: npm run setup  (to configure interactively)`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}✔ All checks passed! Environment is ready.${RESET}`);
  }
}

main().catch((err) => {
  console.error('Validation failed:', err.message);
  process.exit(1);
});
