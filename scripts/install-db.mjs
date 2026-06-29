#!/usr/bin/env node

// =============================================================================
// HVAC AI Lead Intelligence — Database Install Helper
// Shows instructions for installing the database via Supabase SQL Editor.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

function section(text) {
  console.log(`\n${BOLD}${CYAN}${text}${RESET}`);
  console.log(`  ${GRAY}${'─'.repeat(50)}${RESET}`);
}

function step(num, text, detail) {
  console.log(`\n  ${BOLD}Step ${num}:${RESET} ${text}`);
  if (detail) console.log(`  ${GRAY}${detail}${RESET}`);
}

console.log(`\n${BOLD}${GREEN}
  ╔════════════════════════════════════════════════╗
  ║       Database Installation Guide              ║
  ║       HVAC AI Lead Intelligence                ║
  ╚════════════════════════════════════════════════╝${RESET}`);

section('Prerequisites');
console.log(`  • A Supabase project (create at https://supabase.com)`);
console.log(`  • Your Supabase project credentials ready`);

section('Installation Steps');

step('1', 'Create Supabase Project',
  'Go to https://supabase.com → New Project\n' +
  '  Choose name, password, and region closest to your client.');

step('2', 'Open SQL Editor',
  'In your Supabase dashboard, click "SQL Editor" in the left sidebar.\n' +
  '  Click "New Query" to open a blank SQL terminal.');

step('3', 'Run Master Installer');

const installPath = join(root, 'supabase', 'install.sql');
if (existsSync(installPath)) {
  const content = readFileSync(installPath, 'utf-8');
  const lines = content.split('\n').length;
  console.log(`  ${GRAY}File: supabase/install.sql (${lines} lines)${RESET}`);
  console.log(`  ${GRAY}1. Open supabase/install.sql in your editor${RESET}`);
  console.log(`  ${GRAY}2. Copy the entire contents${RESET}`);
  console.log(`  ${GRAY}3. Paste into Supabase SQL Editor${RESET}`);
  console.log(`  ${GRAY}4. Click Run${RESET}`);
} else {
  console.log(`  ${GRAY}ERROR: supabase/install.sql not found!${RESET}`);
}

step('4', 'Seed Demo Data (Optional)',
  'If install.sql was used, demo data is already included.\n' +
  '  To re-seed after a reset, open seed/seed.sql in SQL Editor and run.');

step('5', 'Verify Installation',
  'Open supabase/verify.sql in SQL Editor and run.\n' +
  '  Check that all tables exist, RLS is enabled, and seed data is present.');

section('Quick Commands');
console.log(`  Verify environment:    ${BOLD}npm run validate${RESET}`);
console.log(`  Setup interactively:   ${BOLD}npm run setup${RESET}`);
console.log(`  Configure branding:    ${BOLD}npm run branding${RESET}`);
console.log(`  Start dev server:      ${BOLD}npm run dev${RESET}`);
console.log(`  Build for production:  ${BOLD}npm run build${RESET}`);

section('Next Steps');
console.log(`  After database installation:`);
console.log(`  1. Configure .env.local with your Supabase credentials`);
console.log(`  2. Run: npm run dev`);
console.log(`  3. Open http://localhost:3000`);
console.log(`  4. Sign up and verify everything works`);
console.log(`\n${GREEN}  For detailed instructions, see: DATABASE_INSTALL.md${RESET}\n`);
