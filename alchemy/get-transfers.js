// Fetch recent token transfers to/from the manager wallet on Polygon Amoy
// Usage: npm run transfers
const { alchemy } = require('./index');
require('dotenv').config({ path: '../.env' });

const MANAGER = process.env.MANAGER_WALLET;
if (!MANAGER) { console.error('Error: MANAGER_WALLET not set in .env'); process.exit(1); }

(async () => {
  console.log(`\nRecent transfers for ${MANAGER} on Polygon Amoy:\n`);

  const [sent, received] = await Promise.all([
    alchemy.core.getAssetTransfers({ fromAddress: MANAGER, category: ['erc20', 'erc721', 'erc1155'], maxCount: 10 }),
    alchemy.core.getAssetTransfers({ toAddress:   MANAGER, category: ['erc20', 'erc721', 'erc1155'], maxCount: 10 }),
  ]);

  console.log('SENT:');
  for (const t of sent.transfers) {
    console.log(`  → ${t.to}  ${t.value ?? ''} ${t.asset ?? ''}  (${t.hash})`);
  }

  console.log('\nRECEIVED:');
  for (const t of received.transfers) {
    console.log(`  ← ${t.from}  ${t.value ?? ''} ${t.asset ?? ''}  (${t.hash})`);
  }
})();
