// Alchemy Custom Webhook — GraphQL filter for stllcweb3 contracts on Polygon Amoy
// Used by webhook-setup.js to create a GRAPHQL-type webhook
// Contract addresses are populated from .env after deploy
require('dotenv').config({ path: '../.env' });

const CONTRACT_ADDRESSES = [
  process.env.CONTRACT_EQUITY,
  process.env.CONTRACT_NOTE,
  process.env.CONTRACT_SHTX,
  process.env.CONTRACT_TRACK,
  process.env.CONTRACT_LOYALTY,
  process.env.MANAGER_WALLET,
].filter(Boolean).map(a => a.toLowerCase());

// GraphQL filter — watches logs from all stllcweb3 contracts
const graphqlQuery = `{
  block {
    hash
    number
    timestamp
    logs(filter: { addresses: ${JSON.stringify(CONTRACT_ADDRESSES)} }) {
      data
      topics
      index
      account {
        address
      }
      transaction {
        hash
        nonce
        index
        from { address }
        to   { address }
        value
        gasPrice
        maxFeePerGas
        maxPriorityFeePerGas
        gas
        status
        gasUsed
        cumulativeGasUsed
        effectiveGasPrice
        createdContract { address }
      }
    }
  }
}`;

module.exports = { graphqlQuery, CONTRACT_ADDRESSES };

// Print query when run directly
if (require.main === module) {
  console.log('Watching addresses:', CONTRACT_ADDRESSES);
  console.log('\nGraphQL Query:\n', graphqlQuery);
}
