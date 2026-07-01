// Fetch NFTs owned by the manager wallet on Polygon Amoy
// Usage: npm run nfts
const { alchemy } = require('./index');
require('dotenv').config({ path: '../.env' });

const MANAGER = process.env.MANAGER_WALLET;
if (!MANAGER) { console.error('Error: MANAGER_WALLET not set in .env'); process.exit(1); }

(async () => {
  console.log(`\nFetching NFTs for ${MANAGER}...\n`);
  const { ownedNfts, totalCount } = await alchemy.nft.getNftsForOwner(MANAGER);
  console.log(`Total: ${totalCount}`);
  for (const nft of ownedNfts) {
    console.log(`  [${nft.contract.address}] #${nft.tokenId} — ${nft.name || '(no name)'}`);
  }
})();
