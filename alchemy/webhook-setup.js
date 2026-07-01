// Register Alchemy Notify webhooks for stllcweb3
// Run ONCE after contracts are deployed and your public URL is known
// Usage: WEBHOOK_URL=https://your-ngrok-url.ngrok.io node webhook-setup.js

require('dotenv').config({ path: '../.env' });
const { Alchemy, Network, WebhookType } = require('alchemy-sdk');

const WEBHOOK_URL = process.env.WEBHOOK_URL || process.argv[2];
if (!WEBHOOK_URL) {
  console.error('Error: set WEBHOOK_URL env var or pass URL as argument');
  console.error('  Example: WEBHOOK_URL=https://abc.ngrok.io node webhook-setup.js');
  process.exit(1);
}

const AUTH_TOKEN = process.env.ALCHEMY_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  console.error('Error: ALCHEMY_AUTH_TOKEN not set in .env');
  process.exit(1);
}

const alchemy = new Alchemy({
  apiKey:    process.env.ALCHEMY_API_KEY,
  network:   Network.MATIC_MAINNET,
  authToken: AUTH_TOKEN,
});

const MANAGER_WALLET = process.env.MANAGER_WALLET;

// Contract addresses — populated post-deploy by prepare-import.js
// Update these after running: npx hardhat run scripts/deploy.js --network polygonAmoy
const CONTRACTS = {
  STLLCEquityToken:   process.env.CONTRACT_EQUITY   || null,
  STDealNote:         process.env.CONTRACT_NOTE      || null,
  SHTXUtilityToken:   process.env.CONTRACT_SHTX      || null,
  STDealTrackRecord:  process.env.CONTRACT_TRACK     || null,
  KhakiSolLoyalty:    process.env.CONTRACT_LOYALTY   || null,
};

(async () => {
  console.log('\nRegistering Alchemy Notify webhooks...\n');

  // 1. ADDRESS_ACTIVITY — manager wallet + all deployed contracts
  const watchAddresses = [
    MANAGER_WALLET,
    ...Object.values(CONTRACTS).filter(Boolean),
  ];
  const activityWebhook = await alchemy.notify.createWebhook(
    `${WEBHOOK_URL}/webhook`,
    WebhookType.ADDRESS_ACTIVITY,
    { addresses: watchAddresses, network: Network.MATIC_AMOY }
  );
  console.log(`[ADDRESS_ACTIVITY] id: ${activityWebhook.id}`);
  console.log(`  Watching: ${watchAddresses.join(', ')}`);
  console.log(`  Signing key: ${activityWebhook.signingKey}`);

  // 2. NFT_ACTIVITY — STDealTrackRecord soulbound NFT transfers
  if (CONTRACTS.STDealTrackRecord) {
    const nftWebhook = await alchemy.notify.createWebhook(
      `${WEBHOOK_URL}/webhook`,
      WebhookType.NFT_ACTIVITY,
      {
        filters: [{ contractAddress: CONTRACTS.STDealTrackRecord }],
        network: Network.MATIC_MAINNET,
      }
    );
    console.log(`[NFT_ACTIVITY]     id: ${nftWebhook.id}`);
    console.log(`  Signing key: ${nftWebhook.signingKey}`);
  } else {
    console.log('[NFT_ACTIVITY]     skipped — CONTRACT_TRACK not set');
  }

  console.log('\nDone. Add the signing key(s) above to .env as ALCHEMY_WEBHOOK_SIGNING_KEY');
  console.log('Then start the receiver: node webhook-server.js');
})();
