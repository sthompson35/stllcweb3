/**
 * set-token-uris.js
 *
 * Sets per-token metadata URIs on the ST Spread Collection contract so that
 * OpenSea (and any other indexer) can read names, descriptions, and images
 * directly from the Sequence metadata API.
 *
 * Run:
 *   npx hardhat run scripts/set-token-uris.js --network polygon
 */

const SPREAD_COLLECTION = "0x364621d5b4f77feF957708F0A35cB674A8bf19a9";
const SEQUENCE_BASE     = "https://metadata.sequence.app/projects/48396/collections/2042/tokens";

// Token IDs 1–15 for the ST Spread Collection
const TOKEN_IDS = Array.from({ length: 15 }, (_, i) => i + 1);

const ABI = [
  "function setTokenURI(uint256 tokenId, string calldata tokenURI_) external",
  "function uri(uint256 tokenId) public view returns (string memory)",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Signer:", deployer.address);

  const contract = new ethers.Contract(SPREAD_COLLECTION, ABI, deployer);

  // Verify current URI for token 1 before writing
  const currentUri = await contract.uri(1);
  console.log("Current uri(1):", currentUri);

  console.log("\nSetting token URIs...\n");

  for (const id of TOKEN_IDS) {
    const metadataUrl = `${SEQUENCE_BASE}/${id}.json`;
    process.stdout.write(`  Token ${String(id).padStart(2)} → ${metadataUrl} ... `);

    const tx = await contract.setTokenURI(id, metadataUrl);
    await tx.wait();
    console.log("✓", tx.hash);
  }

  console.log("\nVerifying a sample (token 1)...");
  const newUri = await contract.uri(1);
  console.log("New uri(1):", newUri);
  console.log("\nDone. View on OpenSea:");
  console.log(`https://opensea.io/assets/matic/${SPREAD_COLLECTION}/1`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
