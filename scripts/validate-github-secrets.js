#!/usr/bin/env node

/**
 * Validate that all required GitHub Secrets are configured
 * Usage: node scripts/validate-github-secrets.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_SECRETS = [
  'DEPLOYER_PRIVATE_KEY',
  'POLYGON_AMOY_RPC_URL',
  'VERCEL_TOKEN',
  'RENDER_API_KEY',
  'RENDER_SERVICE_ID'
];

const ADDITIONAL_SECRETS = [
  'POLYGONSCAN_API_KEY',
  'VITE_SEQUENCE_PROJECT_ACCESS_KEY',
  'VITE_SEQUENCE_WAAS_CONFIG_KEY',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID'
];

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     GitHub Secrets Configuration Checker               ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Check if running in GitHub Actions
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

if (isGitHubActions) {
  console.log('✅ Running in GitHub Actions environment\n');
  
  let allSet = true;
  
  console.log('Required Secrets (CRITICAL):');
  REQUIRED_SECRETS.forEach(secret => {
    if (process.env[secret]) {
      console.log(`  ✅ ${secret}`);
    } else {
      console.log(`  ❌ ${secret} — NOT SET`);
      allSet = false;
    }
  });
  
  console.log('\nOptional/Staging Secrets:');
  ADDITIONAL_SECRETS.forEach(secret => {
    if (process.env[secret]) {
      console.log(`  ✅ ${secret}`);
    } else {
      console.log(`  ⚠️  ${secret} — not set (staging may fail)`);
    }
  });
  
  if (!allSet) {
    console.log('\n❌ VALIDATION FAILED\n');
    console.log('Missing secrets. Add them via:');
    console.log('  https://github.com/sthompson35/stllcweb3/settings/secrets/actions\n');
    process.exit(1);
  }
  
  console.log('\n✅ ALL REQUIRED SECRETS ARE SET\n');
  process.exit(0);
} else {
  // Local development - just show what's needed
  console.log('Local Environment Check (not in GitHub Actions)\n');
  console.log('To see actual secrets, run this in GitHub Actions:\n');
  console.log('  1. Go to: https://github.com/sthompson35/stllcweb3/actions\n');
  console.log('  2. Run any workflow (e.g., CI)\n');
  console.log('  3. Check "Run workflow" logs for secret verification\n');
  
  console.log('To add secrets manually:');
  console.log('  1. https://github.com/sthompson35/stllcweb3/settings/secrets/actions\n');
  console.log('Required secrets:');
  REQUIRED_SECRETS.forEach(secret => {
    console.log(`  • ${secret}`);
  });
  console.log('\n');
  process.exit(0);
}
