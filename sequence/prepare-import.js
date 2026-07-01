#!/usr/bin/env node
// sequence/prepare-import.js
// Run after: npx hardhat run scripts/deploy.js --network polygonAmoy
// Reads deployments/polygonAmoy.json → writes sequence-contracts.populated.json
// with real addresses filled in, ready to paste into Sequence Builder project #48396

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const MANIFEST = path.join(__dirname, 'sequence-contracts.json');
const OUT_FILE = path.join(__dirname, 'sequence-contracts.populated.json');

// Support polygon mainnet or amoy testnet
const DEPLOY_FILE =
  fs.existsSync(path.join(ROOT, 'deployments', 'polygon.json'))
    ? path.join(ROOT, 'deployments', 'polygon.json')
    : path.join(ROOT, 'deployments', 'polygonAmoy.json');

// ---------- load files ----------
if (!fs.existsSync(DEPLOY_FILE)) {
  console.error('ERROR: No deployment file found (polygon.json or polygonAmoy.json).');
  console.error('       Run: npx hardhat run scripts/deploy.js --network polygon');
  process.exit(1);
}
console.log(`Using deployment: ${path.basename(DEPLOY_FILE)}`);

const deployment = JSON.parse(fs.readFileSync(DEPLOY_FILE, 'utf8'));
const manifest   = JSON.parse(fs.readFileSync(MANIFEST,    'utf8'));

// ---------- address lookup helpers ----------
// deployment.json stores addresses by contract name
// STLLCEquityToken is UUPS — we need the proxy address
function resolveAddress(contractName) {
  const c = deployment.contracts || deployment;

  if (contractName === 'STLLCEquityToken') {
    // UUPS proxy: look for proxy key first, then fall back to top-level
    return (c.STLLCEquityToken && (c.STLLCEquityToken.proxy || c.STLLCEquityToken))
        || c.STLLCEquityTokenProxy
        || null;
  }

  // Standard: c.STDealNote, c.STDealNote008, etc.
  return c[contractName]
      || c[contractName + '008']
      || null;
}

// ---------- populate addresses ----------
let populated = 0;
for (const contract of manifest.contracts) {
  const addr = resolveAddress(contract.name);
  if (addr && typeof addr === 'string' && addr.startsWith('0x')) {
    contract.addresses.testnet = addr;
    populated++;
    console.log(`  ${contract.name.padEnd(22)} → ${addr}`);
  } else {
    console.warn(`  ${contract.name.padEnd(22)} → NOT FOUND in deployment`);
  }
}

// ---------- write output ----------
fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));

console.log('');
console.log(`Populated ${populated}/${manifest.contracts.length} contracts.`);
console.log(`Output: sequence/sequence-contracts.populated.json`);
console.log('');
console.log('Next steps:');
console.log('  1. Open https://sequence.build/project/48396/contracts');
console.log('  2. For each contract below, click "Import Contract":');
console.log('     - Paste the address from sequence-contracts.populated.json');
console.log('     - Upload the matching ABI from sequence/abis/<ContractName>.json');
console.log('     - Set network to Polygon Amoy (chain 80002)');
console.log('');

// ---------- print import cheat-sheet ----------
const populated_manifest = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
console.log('--- IMPORT CHEAT SHEET ---');
for (const c of populated_manifest.contracts) {
  const addr = c.addresses.testnet;
  console.log('');
  console.log(`Contract : ${c.label} (${c.name})`);
  console.log(`Standard : ${c.standard}`);
  console.log(`Address  : ${addr || '(not deployed)'}`);
  console.log(`ABI file : ${c.abiFile.replace('./', 'sequence/')}`);
  if (c.notes) console.log(`Note     : ${c.notes}`);
}
console.log('');
console.log('--------------------------');
