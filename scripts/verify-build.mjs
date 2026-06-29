#!/usr/bin/env node

// =============================================================================
// HVAC AI Lead Intelligence — Build Verification Script
// Runs lint, typecheck, and build sequentially. Reports results clearly.
// =============================================================================

import { execSync } from 'node:child_process';

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

let allPassed = true;

function runStep(name, command) {
  console.log(`\n${BOLD}${'═'.repeat(60)}${RESET}`);
  console.log(`${BOLD}▶ ${name}${RESET}`);
  console.log(`${GRAY}  ${command}${RESET}\n`);

  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 180000,
    });
    console.log(output.trim());
    console.log(`\n${GREEN}✔ ${name} — PASSED${RESET}`);
    return true;
  } catch (err) {
    console.log(err.stdout?.trim() || '');
    console.error(err.stderr?.trim() || '');
    console.log(`\n${RED}✘ ${name} — FAILED${RESET}`);
    allPassed = false;
    return false;
  }
}

console.log(`\n${BOLD}${GREEN}
  ╔════════════════════════════════════════════════╗
  ║       Build Verification Suite                 ║
  ║       HVAC AI Lead Intelligence                ║
  ╚════════════════════════════════════════════════╝${RESET}`);

console.log(`\n${GRAY}Running: lint → typecheck → build${RESET}`);

const lintPassed = runStep('ESLint', 'npx eslint');
const typecheckPassed = runStep('TypeScript Check', 'npx tsc --noEmit');
const buildPassed = runStep('Production Build', 'npm run build');

// Summary
console.log(`\n${BOLD}${'═'.repeat(60)}${RESET}`);
console.log(`${BOLD}Results Summary${RESET}`);

const results = [
  { name: 'ESLint', passed: lintPassed },
  { name: 'TypeScript', passed: typecheckPassed },
  { name: 'Build', passed: buildPassed },
];

for (const r of results) {
  const icon = r.passed ? `${GREEN}✔${RESET}` : `${RED}✘${RESET}`;
  console.log(`  ${icon} ${r.name}`);
}

if (allPassed) {
  console.log(`\n${GREEN}${BOLD}✔ All checks passed! Project is production-ready.${RESET}\n`);
} else {
  console.log(`\n${RED}${BOLD}✘ Some checks failed. Review the output above.${RESET}\n`);
  process.exit(1);
}
