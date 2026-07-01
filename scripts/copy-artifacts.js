#!/usr/bin/env node
// scripts/copy-artifacts.js
// Run after `hardhat compile` to copy the 5 STLLC contract ABIs into
// frontend/public/artifacts/ so Vite's dev server can serve them.

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const ARTIFACTS   = path.join(ROOT, 'artifacts', 'contracts', 'core');
const DEST        = path.join(ROOT, 'frontend', 'public', 'artifacts', 'contracts', 'core');

const CONTRACTS = [
  'STLLCEquityToken',
  'STDealNote',
  'SHTXUtilityToken',
  'STDealTrackRecord',
  'KhakiSolLoyalty',
  'STLLCAsset',
];

let copied = 0;
let missing = 0;

for (const name of CONTRACTS) {
  const src  = path.join(ARTIFACTS, `${name}.sol`, `${name}.json`);
  const dest = path.join(DEST,      `${name}.sol`, `${name}.json`);

  if (!fs.existsSync(src)) {
    console.warn(`  [copy-artifacts] MISSING: ${name}.json — run: npm run compile`);
    missing++;
    continue;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  [copy-artifacts] ✓ ${name}.json → frontend/public/artifacts/`);
  copied++;
}

console.log(`\n  Copied ${copied}/${CONTRACTS.length} artifact(s).${missing ? ` (${missing} missing — compile first)` : ''}\n`);
