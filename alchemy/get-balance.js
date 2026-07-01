// Fetch MATIC + ERC-20 token balances for the manager wallet on Polygon Amoy
// Usage: npm run balance
const { alchemy } = require('./index');
require('dotenv').config({ path: '../.env' });
const { Utils } = require('alchemy-sdk');

const MANAGER = process.env.MANAGER_WALLET;
if (!MANAGER) { console.error('Error: MANAGER_WALLET not set in .env'); process.exit(1); }

(async () => {
  console.log(`\nBalances for ${MANAGER} on Polygon Amoy:\n`);

  // Native MATIC
  const maticWei = await alchemy.core.getBalance(MANAGER);
  console.log(`  MATIC: ${Utils.formatEther(maticWei)}`);

  // ERC-20 tokens held
  const { tokenBalances } = await alchemy.core.getTokenBalances(MANAGER);
  for (const t of tokenBalances) {
    if (t.tokenBalance === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
    const meta = await alchemy.core.getTokenMetadata(t.contractAddress);
    const decimals = meta.decimals || 18;
    const raw = BigInt(t.tokenBalance);
    const formatted = (Number(raw) / Math.pow(10, decimals)).toFixed(4);
    console.log(`  ${meta.symbol || t.contractAddress}: ${formatted}`);
  }
})();
