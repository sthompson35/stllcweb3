// scripts/deploy-spread-collection.js
// Deploys only STSpreadCollection, referencing existing deployed addresses.

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const USDC_POLYGON = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_AMOY    = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";

const MANAGER_WALLET = /^0x[0-9a-fA-F]{40}$/.test(process.env.MANAGER_WALLET)
  ? process.env.MANAGER_WALLET
  : null;

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const manager = MANAGER_WALLET || deployer.address;

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   STSpreadCollection — Targeted Deployment        ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  Network  : ${network.name} (chainId ${chainId})`);
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.utils.formatEther(await deployer.getBalance())} MATIC`);
  console.log(`  Manager  : ${manager}\n`);

  const usdcAddress = chainId === 137 ? USDC_POLYGON : USDC_AMOY;
  console.log(`  USDC     : ${usdcAddress}\n`);

  console.log("💎  Deploying STSpreadCollection (15-token ERC-1155)...");
  const STSpreadCollection = await ethers.getContractFactory("STSpreadCollection");
  const spread = await STSpreadCollection.deploy(
    usdcAddress,
    manager,
    "https://api.stllc.com/spread-collection/metadata/{id}.json"
  );
  await spread.deployed();
  console.log(`    ✅  Address: ${spread.address}`);
  console.log(`    IDs 1-5  : Deal Note NFTs (USDC yield, Reg D 506c)`);
  console.log(`    IDs 6-10 : KhakiSol Product NFTs (5% royalty)`);
  console.log(`    IDs 11-15: Spread Badges (SHTX accrual + cooldown)`);

  // ─── Load existing manifest and update ──────────────────────────────────────
  const manifestPath = path.join(__dirname, `../deployments/${network.name}.json`);
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }
  manifest.contracts = manifest.contracts || {};
  manifest.contracts.STSpreadCollection = spread.address;
  manifest.timestamp = new Date().toISOString();
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄  Manifest updated: ${manifestPath}`);

  // ─── Copy to frontend/public ────────────────────────────────────────────────
  const feDir = path.join(__dirname, "../frontend/public/deployments");
  fs.mkdirSync(feDir, { recursive: true });
  fs.writeFileSync(path.join(feDir, `${network.name}.json`), JSON.stringify(manifest, null, 2));
  console.log(`📄  Frontend copy updated.`);

  console.log(`\n  Next: update ADDRESSES.spreadCollection in frontend/src/contracts.ts`);
  console.log(`  Address: ${spread.address}\n`);

  return spread.address;
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
