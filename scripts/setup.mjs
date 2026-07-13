#!/usr/bin/env node

// =============================================================================
// AI Lead Scoring CRM — Interactive Setup Wizard
// Guides developers through first-time deployment configuration.
// Generates .env.local, validates inputs, and shows next steps.
// =============================================================================

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const rl = readline.createInterface({ input, output });

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function header(text) {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════`);
  console.log(` ${text}`);
  console.log(`═══════════════════════════════════════════${RESET}\n`);
}

function success(text) {
  console.log(`${GREEN}✔ ${text}${RESET}`);
}

function warn(text) {
  console.log(`${YELLOW}⚠ ${text}${RESET}`);
}

// ──────────────────────────────────────────────
// 1. Project Details
// ──────────────────────────────────────────────
async function getProjectDetails() {
  header('Step 1: Project Details');

  const projectName = await rl.question(`  ${BOLD}Project Name${RESET} (ai-lead-scoring-crm): `) || 'ai-lead-scoring-crm';

  const companyName = await rl.question(`  ${BOLD}Company Name${RESET} (AI Lead Scoring CRM): `) || 'AI Lead Scoring CRM';

  const appUrl = await rl.question(`  ${BOLD}Application URL${RESET} (https://your-app.vercel.app): `) || 'https://your-app.vercel.app';

  return { projectName, companyName, appUrl };
}

// ──────────────────────────────────────────────
// 2. Supabase Configuration
// ──────────────────────────────────────────────
async function getSupabaseConfig() {
  header('Step 2: Supabase Configuration');

  const supabaseUrl = await rl.question(`  ${BOLD}Supabase Project URL${RESET} (https://your-project.supabase.co): `);

  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    warn('Invalid URL format. Using placeholder.');
  }

  const supabaseKey = await rl.question(`  ${BOLD}Supabase Anon Key${RESET}: `);

  if (!supabaseKey || supabaseKey.length < 10) {
    warn('Key seems too short. Make sure to use your actual Supabase anon key.');
  }

  const serviceRoleKey = await rl.question(`  ${BOLD}Supabase Service Role Key${RESET} (keep secret): `);

  return {
    url: supabaseUrl || 'https://your-project.supabase.co',
    key: supabaseKey || 'your-supabase-anon-key',
    serviceKey: serviceRoleKey || 'your-service-role-key',
  };
}

// ──────────────────────────────────────────────
// 3. OpenRouter Configuration
// ──────────────────────────────────────────────
async function getOpenRouterConfig() {
  header('Step 3: OpenRouter AI Configuration');

  const apiKey = await rl.question(`  ${BOLD}OpenRouter API Key${RESET} (sk-or-...): `);

  if (apiKey && !apiKey.startsWith('sk-or-')) {
    warn('OpenRouter keys typically start with "sk-or-". Verify your key.');
  }

  return { apiKey: apiKey || 'your-openrouter-api-key' };
}

// ──────────────────────────────────────────────
// 4. n8n Configuration
// ──────────────────────────────────────────────
async function getN8nConfig() {
  header('Step 4: n8n Workflow Automation');

  const n8nUrl = await rl.question(`  ${BOLD}n8n URL${RESET} (http://localhost:5678): `) || 'http://localhost:5678';

  const n8nUser = await rl.question(`  ${BOLD}n8n Username${RESET} (admin): `) || 'admin';

  const n8nPass = await rl.question(`  ${BOLD}n8n Password${RESET}: `);

  return {
    url: n8nUrl,
    user: n8nUser,
    pass: n8nPass || 'your-n8n-password',
  };
}

// ──────────────────────────────────────────────
// 5. Email Provider
// ──────────────────────────────────────────────
async function getEmailConfig() {
  header('Step 5: Email Provider (Optional)');

  const smtpHost = await rl.question(`  ${BOLD}SMTP Host${RESET} (smtp.sendgrid.net): `) || '';

  const smtpPort = await rl.question(`  ${BOLD}SMTP Port${RESET} (587): `) || '';

  const smtpUser = await rl.question(`  ${BOLD}SMTP Username${RESET}: `) || '';

  const smtpPass = await rl.question(`  ${BOLD}SMTP Password${RESET}: `) || '';

  const fromEmail = await rl.question(`  ${BOLD}From Email${RESET}: `) || '';

  return { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass, from: fromEmail };
}

// ──────────────────────────────────────────────
// Generate .env.local
// ──────────────────────────────────────────────
function generateEnvFile(project, supabase, openrouter, n8n, email) {
  const lines = [
    '# =============================================================================',
    `# ${project.projectName} — Local Environment Configuration`,
    '# Generated by setup.mjs on ' + new Date().toISOString().slice(0, 10),
    '# =============================================================================',
    '',
    '# ── Supabase ────────────────────────────────────────────────────────────────',
    `NEXT_PUBLIC_SUPABASE_URL=${supabase.url}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabase.key}`,
    `SUPABASE_SERVICE_ROLE_KEY=${supabase.serviceKey}`,
    '',
    '# ── AI (OpenRouter) ─────────────────────────────────────────────────────────',
    `OPENROUTER_API_KEY=${openrouter.apiKey}`,
    '',
    '# ── n8n Automation ──────────────────────────────────────────────────────────',
    `N8N_URL=${n8n.url}`,
    `N8N_WEBHOOK_URL=${n8n.url}/webhook`,
    `N8N_USERNAME=${n8n.user}`,
    `N8N_PASSWORD=${n8n.pass}`,
    '',
  ];

  if (email.host) {
    lines.push(
      '# ── Email (SMTP) ───────────────────────────────────────────────────────────',
      `SMTP_HOST=${email.host}`,
      `SMTP_PORT=${email.port || '587'}`,
      `SMTP_USER=${email.user}`,
      `SMTP_PASS=${email.pass}`,
      `SMTP_FROM_EMAIL=${email.from}`,
      '',
    );
  }

  lines.push(
    '# ── Branding Override ───────────────────────────────────────────────────────',
    `BRANDING_CONFIG={"companyName": "${project.companyName}"}`,
    '',
    '# ── Application ─────────────────────────────────────────────────────────────',
    `NEXT_PUBLIC_APP_URL=${project.appUrl}`,
    '',
  );

  return lines.join('\n');
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  console.log(`${BOLD}${GREEN}
  ╔════════════════════════════════════════════════╗
  ║   AI Lead Scoring CRM — Setup Wizard           ║
  ║   Sprint 05.4 — Deployment Configuration       ║
  ╚════════════════════════════════════════════════╝${RESET}`);
  console.log(`\nThis wizard will guide you through configuring a new deployment.\n`);

  const project = await getProjectDetails();
  const supabase = await getSupabaseConfig();
  const openrouter = await getOpenRouterConfig();
  const n8n = await getN8nConfig();
  const email = await getEmailConfig();

  // ── Generate and write .env.local ──
  header('Generating Configuration');

  const envContent = generateEnvFile(project, supabase, openrouter, n8n, email);
  const envPath = join(root, '.env.local');

  writeFileSync(envPath, envContent, 'utf-8');
  success(`Created .env.local with your configuration`);

  // ── Summary ──
  header('Setup Complete — Next Steps');

  console.log(`  ${BOLD}1. Install database:${RESET}`);
  console.log(`     Open supabase/install.sql in Supabase SQL Editor and run it.`);
  console.log(`     Or follow: DATABASE_INSTALL.md`);
  console.log();
  console.log(`  ${BOLD}2. Start development server:${RESET}`);
  console.log(`     npm run dev`);
  console.log();
  console.log(`  ${BOLD}3. Build for production:${RESET}`);
  console.log(`     npm run build`);
  console.log();
  console.log(`  ${BOLD}4. Deploy to Vercel:${RESET}`);
  console.log(`     See docs/DEPLOYMENT_VERCEL.md`);
  console.log();
  console.log(`  ${BOLD}5. Configure branding:${RESET}`);
  console.log(`     npm run branding`);
  console.log();
  console.log(`  ${BOLD}6. Validate environment:${RESET}`);
  console.log(`     npm run validate`);
  console.log();

  success('Happy deploying!');

  rl.close();
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
