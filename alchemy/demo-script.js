// Alchemy SDK — stllcweb3 core instance
// Network: Polygon Amoy testnet (swap to Network.MATIC_MAINNET for production)
require('dotenv').config({ path: '../.env' });
const { Alchemy, Network } = require('alchemy-sdk');

const alchemy = new Alchemy({
  apiKey:  process.env.ALCHEMY_API_KEY,
  network: Network.MATIC_AMOY,
});

module.exports = { alchemy, Network };
