#!/usr/bin/env node

// =============================================================================
// HVAC AI Lead Intelligence — Branding Setup Wizard
// Configures company branding through the centralized config system.
// Updates config/brandingConfig.ts with your client's information.
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
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

function header(text) {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════`);
  console.log(` ${text}`);
  console.log(`═══════════════════════════════════════════${RESET}\n`);
}

function success(text) {
  console.log(`${GREEN}✔ ${text}${RESET}`);
}

function bold(text) {
  return `${BOLD}${text}${RESET}`;
}

function dim(text) {
  return `${GRAY}${text}${RESET}`;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  console.log(`${BOLD}${GREEN}
  ╔════════════════════════════════════════════╗
  ║        HVAC Branding Configuration         ║
  ║    Customize your client's application     ║
  ╚════════════════════════════════════════════╝${RESET}`);

  header('Company Information');
  const companyName = await rl.question(`  ${bold('Company Name')} ${dim('(HVAC Lead Intelligence)')}: `) || 'HVAC Lead Intelligence';
  const applicationName = await rl.question(`  ${bold('Application Name')} ${dim('(HVAC Lead Intelligence)')}: `) || 'HVAC Lead Intelligence';
  const website = await rl.question(`  ${bold('Website URL')} ${dim('(https://example.com)')}: `) || 'https://example.com';

  header('Contact Information');
  const email = await rl.question(`  ${bold('Company Email')} ${dim('(info@example.com)')}: `) || 'info@example.com';
  const phone = await rl.question(`  ${bold('Company Phone')} ${dim('(+1-800-555-1234)')}: `) || '+1-800-555-1234';
  const address = await rl.question(`  ${bold('Company Address')} ${dim('(123 Main St, City, State)')}: `) || '123 Main Street, City, State ZIP';

  header('Brand Colors');
  const primaryColor = await rl.question(`  ${bold('Primary Color')} ${dim('(#2563eb)')}: `) || '#2563eb';
  const secondaryColor = await rl.question(`  ${bold('Secondary Color')} ${dim('(#10b981)')}: `) || '#10b981';
  const accentColor = await rl.question(`  ${bold('Accent Color')} ${dim('(#f59e0b)')}: `) || '#f59e0b';

  header('Business Configuration');
  const timeZone = await rl.question(`  ${bold('Time Zone')} ${dim('(America/New_York)')}: `) || 'America/New_York';
  const currency = await rl.question(`  ${bold('Currency')} ${dim('(USD)')}: `) || 'USD';
  const bizHoursStart = await rl.question(`  ${bold('Business Hours Start')} ${dim('(08:00)')}: `) || '08:00';
  const bizHoursEnd = await rl.question(`  ${bold('Business Hours End')} ${dim('(18:00)')}: `) || '18:00';

  // ── Generate updated brandingConfig.ts ──
  header('Generating Configuration');

  const brandingContent = `import { z } from 'zod';

// Branding configuration schema
export const BrandingConfigSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyLogo: z.string().url('Company logo must be a valid URL'),
  companyEmail: z.string().email('Company email must be valid'),
  companyPhone: z.string().min(7, 'Company phone is required'),
  companyAddress: z.string().min(5, 'Company address is required'),
  website: z.string().url('Company website must be a valid URL'),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Primary color must be a valid hex color'),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Secondary color must be a valid hex color'),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Accent color must be a valid hex color'),
  favicon: z.string().url('Favicon must be a valid URL'),
  applicationName: z.string().min(1, 'Application name is required'),
});

export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;

// Default branding configuration (customized by branding wizard)
export const defaultBrandingConfig: BrandingConfig = {
  companyName: '${companyName}',
  companyLogo: 'https://${website.replace(/^https?:\/\//, '')}/logo.png',
  companyEmail: '${email}',
  companyPhone: '${phone}',
  companyAddress: '${address}',
  website: '${website}',
  primaryColor: '${primaryColor}',
  secondaryColor: '${secondaryColor}',
  accentColor: '${accentColor}',
  favicon: 'https://${website.replace(/^https?:\/\//, '')}/favicon.png',
  applicationName: '${applicationName}',
};

// Validate and export configuration
const config = BrandingConfigSchema.parse(process.env.BRANDING_CONFIG ? JSON.parse(process.env.BRANDING_CONFIG) : defaultBrandingConfig);
export const brandingConfig = config;
`;

  const brandingPath = join(root, 'config', 'brandingConfig.ts');
  writeFileSync(brandingPath, brandingContent, 'utf-8');
  success(`Updated config/brandingConfig.ts with your branding`);

  // ── Summary ──
  console.log(`\n${BOLD}Branding Configuration Summary${RESET}`);
  console.log(`  Company:      ${companyName}`);
  console.log(`  Email:        ${email}`);
  console.log(`  Phone:        ${phone}`);
  console.log(`  Website:      ${website}`);
  console.log(`  Primary:      ${primaryColor}`);
  console.log(`  Secondary:    ${secondaryColor}`);
  console.log(`  Accent:       ${accentColor}`);
  console.log(`  Time Zone:    ${timeZone}`);
  console.log(`  Currency:     ${currency}`);
  console.log(`  Hours:        ${bizHoursStart} - ${bizHoursEnd}`);

  console.log(`\n${GREEN}✔ Branding configured successfully!${RESET}`);
  console.log(`  Restart your dev server to see changes.`);

  rl.close();
}

main().catch((err) => {
  console.error('Branding setup failed:', err.message);
  process.exit(1);
});
