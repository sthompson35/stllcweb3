#!/usr/bin/env node

/**
 * STLLCWeb3 Pre-Flight Checklist
 * Verifies all prerequisites are met before initiating go-live
 * Usage: node scripts/pre-flight-check.js
 */

const fs = require('fs');
const path = require('path');

const checks = {
  files: [],
  env: [],
  git: [],
  npm: [],
  docker: [],
  contracts: [],
  passed: 0,
  failed: 0
};

function check(category, name, condition, fix = '') {
  const status = condition ? '✅' : '❌';
  checks[category].push({ name, status, fix });
  if (condition) checks.passed++;
  else checks.failed++;
}

function printSection(title, items) {
  console.log(`\n${title}`);
  console.log('═'.repeat(60));
  items.forEach(item => {
    console.log(`${item.status} ${item.name}`);
    if (item.status === '❌' && item.fix) {
      console.log(`   └─ Fix: ${item.fix}`);
    }
  });
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     STLLCWeb3 PRE-FLIGHT CHECKLIST                     ║');
console.log('║     Go-Live Readiness Verification                    ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const ROOT = path.resolve(__dirname, '..');

// ── Files ──────────────────────────────────────────────────────────
console.log('Checking critical files...');

const criticalFiles = [
  { path: 'package.json', desc: 'Root package.json' },
  { path: 'hardhat.config.js', desc: 'Hardhat config' },
  { path: 'frontend/package.json', desc: 'Frontend package.json' },
  { path: '.github/workflows/ci.yml', desc: 'CI workflow' },
  { path: '.github/workflows/deploy-staging.yml', desc: 'Staging deploy workflow' },
  { path: '.github/workflows/deploy-contracts-amoy.yml', desc: 'Amoy deploy workflow' },
  { path: '.github/workflows/deploy-contracts-mainnet.yml', desc: 'Mainnet deploy workflow' },
  { path: '.github/workflows/deploy-production.yml', desc: 'Production canary workflow' },
  { path: '.github/workflows/rollback.yml', desc: 'Rollback workflow' },
  { path: 'GO-LIVE-STRATEGY.md', desc: 'Go-live strategy document' },
  { path: 'GO-LIVE-EXECUTION-CHECKLIST.md', desc: 'Execution checklist' },
  { path: 'INCIDENT-RESPONSE.md', desc: 'Incident response playbook' },
  { path: 'GITHUB-SECRETS-SETUP.md', desc: 'GitHub Secrets guide' },
  { path: 'QUICK-START-SECRETS.md', desc: 'Quick start secrets guide' },
  { path: 'DOCUMENTATION-INDEX.md', desc: 'Documentation index' },
  { path: 'supabase/migrations/001_stllc_core_schema.sql', desc: 'Supabase schema migration' },
  { path: 'supabase/migrations/002_stllc_seed_data.sql', desc: 'Supabase seed data' },
  { path: 'scripts/supabase-setup.js', desc: 'Supabase setup script' },
  { path: 'scripts/health-check.js', desc: 'Health check script' },
  { path: 'scripts/init-mainnet.js', desc: 'Mainnet init script' },
  { path: 'docker-compose.yml', desc: 'Docker Compose file' },
  { path: 'render.yaml', desc: 'Render.yaml deployment config' },
];

criticalFiles.forEach(file => {
  const fullPath = path.join(ROOT, file.path);
  const exists = fs.existsSync(fullPath);
  check('files', file.desc, exists, `Create: ${file.path}`);
});

// ── Environment ────────────────────────────────────────────────────
console.log('Checking environment files...');

const envFiles = [
  { path: '.env', desc: 'Local .env file' },
  { path: '.env.staging', desc: 'Staging env template' },
  { path: '.env.production', desc: 'Production env template' },
];

envFiles.forEach(file => {
  const fullPath = path.join(ROOT, file.path);
  const exists = fs.existsSync(fullPath);
  check('env', file.desc, exists, `Create from template: ${file.path}.example`);
});

// ── Git ────────────────────────────────────────────────────────────
console.log('Checking git configuration...');

try {
  const gitConfigPath = path.join(ROOT, '.git');
  const isGitRepo = fs.existsSync(gitConfigPath);
  check('git', 'Git repository initialized', isGitRepo, 'Run: git init');
  
  // Check for remote
  let hasRemote = false;
  try {
    const gitConfig = fs.readFileSync(path.join(gitConfigPath, 'config'), 'utf-8');
    hasRemote = gitConfig.includes('github.com/sthompson35/stllcweb3');
  } catch (e) {}
  check('git', 'GitHub remote configured', hasRemote, 
    'Run: git remote add origin https://github.com/sthompson35/stllcweb3.git');
} catch (e) {
  check('git', 'Git repository initialized', false, 'Run: git init');
}

// ── NPM ────────────────────────────────────────────────────────────
console.log('Checking npm dependencies...');

try {
  const nodeModules = fs.existsSync(path.join(ROOT, 'node_modules'));
  check('npm', 'Root dependencies installed', nodeModules, 'Run: npm install');
  
  const frontendModules = fs.existsSync(path.join(ROOT, 'frontend', 'node_modules'));
  check('npm', 'Frontend dependencies installed', frontendModules, 'Run: cd frontend && npm install');
} catch (e) {
  check('npm', 'Root dependencies installed', false);
  check('npm', 'Frontend dependencies installed', false);
}

// ── Smart Contracts ────────────────────────────────────────────────
console.log('Checking smart contracts...');

const contracts = [
  'STLLCEquityToken.sol',
  'STDealNote.sol',
  'SHTXUtilityToken.sol',
  'STDealTrackRecord.sol',
  'KhakiSolLoyalty.sol',
  'STLLCAsset.sol',
];

contracts.forEach(contract => {
  const fullPath = path.join(ROOT, 'contracts', 'core', contract);
  const exists = fs.existsSync(fullPath);
  check('contracts', `${contract} contract exists`, exists);
});

const testsPath = path.join(ROOT, 'test');
const hasTests = fs.existsSync(testsPath) && fs.readdirSync(testsPath).length > 0;
check('contracts', 'Contract tests exist', hasTests, 'Run: npm test');

// ── Docker ─────────────────────────────────────────────────────────
console.log('Checking Docker configuration...');

const dockerFiles = [
  { path: 'Dockerfile', desc: 'Dockerfile' },
  { path: 'docker-compose.yml', desc: 'docker-compose.yml' },
  { path: 'docker-compose.override.yml', desc: 'docker-compose.override.yml' },
];

dockerFiles.forEach(file => {
  const fullPath = path.join(ROOT, file.path);
  const exists = fs.existsSync(fullPath);
  check('docker', file.desc, exists);
});

// ── Print Results ──────────────────────────────────────────────────

printSection('📄 Critical Files', checks.files);
printSection('🔐 Environment Files', checks.env);
printSection('📦 Git Configuration', checks.git);
printSection('📚 NPM Dependencies', checks.npm);
printSection('🔗 Smart Contracts', checks.contracts);
printSection('🐳 Docker Configuration', checks.docker);

// ── Summary ────────────────────────────────────────────────────────

const total = checks.passed + checks.failed;
const percentage = Math.round((checks.passed / total) * 100);

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log(`║  ${checks.passed}/${total} checks passed (${percentage}%)                        ║`);
console.log('╚════════════════════════════════════════════════════════╝\n');

if (checks.failed === 0) {
  console.log('✅ ALL CHECKS PASSED — Ready to begin go-live!\n');
  console.log('Next steps:');
  console.log('1. Read: GO-LIVE-EXECUTION-CHECKLIST.md');
  console.log('2. Follow: QUICK-START-SECRETS.md (add GitHub Secrets)');
  console.log('3. Start: Phase 1 of GO-LIVE-EXECUTION-CHECKLIST.md\n');
  process.exit(0);
} else {
  console.log(`❌ ${checks.failed} checks failed — Fix issues before proceeding\n`);
  console.log('Fix the items marked with ❌ and run this script again.\n');
  process.exit(1);
}
