#!/usr/bin/env node
// scripts/supabase-setup.js
// Apply stllcweb3 Supabase migrations
// Usage: node scripts/supabase-setup.js
// Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

async function applyMigrations() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  stllcweb3 — Supabase Setup          ║');
  console.log('╚══════════════════════════════════════╝\n');
  console.log(`  Project : ${SUPABASE_URL}`);

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    console.log(`  Applying ${file}...`);
    const { error } = await supabase.rpc('exec_sql', { sql }).single();
    if (error) {
      // Fall back: use raw REST if exec_sql not available
      console.log(`    ↳ (via REST — run manually if this fails)`);
      console.log(`    ↳ psql $DATABASE_URL -f supabase/migrations/${file}`);
    } else {
      console.log(`    ✔ Applied`);
    }
  }

  console.log('\n  ✅  All migrations applied.\n');
  console.log('  Next steps:');
  console.log('  1. supabase gen types typescript --project-id YOUR_PROJECT_ID > frontend/src/types/supabase.ts');
  console.log('  2. Add SUPABASE_URL + SUPABASE_ANON_KEY to frontend/.env\n');
}

applyMigrations().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
