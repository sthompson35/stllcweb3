// scripts/deploy.js
// Deploy all stllcweb3 contracts to Polygon (or testnet)
// Integrates with Sequence Builder for contract management

const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  // Polygon USDC address (6 decimals)
  USDC_POLYGON:   "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  USDC_AMOY:      "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // testnet mock
  USDC_HARDHAT:   "", // deployed locally

  // Sequence Builder project wallet (set via .env) — validated: must be a real 20-byte hex address
  MANAGER_WALLET: /^0x[0-9a-fA-F]{40}$/.test(process.env.MANAGER_WALLET) ? process.env.MANAGER_WALLET : null,

  // Deal Note params for ST-DEAL-008
  DEAL_008: {
    totalTokens:       1290,
    faceValuePerToken: 100e6,   // $100 USDC (6 decimals)
    repaymentPerToken: 106e6,   // $106 USDC at maturity
    maturityDate:      Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60), // 180 days
    dealRef:           "ST-DEAL-008 — 142 Ridgewood Dr, De Soto MO",
    propertyAddress:   "142 Ridgewood Dr, De Soto, MO 63020",
    arvUSD:            19500000, // $195,000 in USD cents
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║       stllcweb3 — Deployment Suite            ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log(`  Network   : ${network.name} (chainId ${chainId})`);
  console.log(`  Deployer  : ${deployer.address}`);
  console.log(`  Balance   : ${ethers.utils.formatEther(await deployer.getBalance())} MATIC\n`);

  const manager = CONFIG.MANAGER_WALLET || deployer.address;
  let usdcAddress;

  // ─── Local testnet: deploy mock USDC ────────────────────────────────────────
  if (chainId === 31337) {
    console.log("📦  Deploying mock USDC for local testing...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy(deployer.address);
    await mockUsdc.deployed();
    usdcAddress = mockUsdc.address;
    console.log(`    MockUSDC deployed: ${usdcAddress}`);
  } else {
    usdcAddress = chainId === 137 ? CONFIG.USDC_POLYGON : CONFIG.USDC_AMOY;
    console.log(`    Using USDC: ${usdcAddress}`);
  }

  const deployments = {};

  // ─── 1. STLLCEquityToken (UUPS Upgradeable) ──────────────────────────────────
  console.log("\n🏠  Deploying STLLCEquityToken...");
  const STLLCEquityToken = await ethers.getContractFactory("STLLCEquityToken");
  const equityProxy = await upgrades.deployProxy(
    STLLCEquityToken,
    [usdcAddress, manager],
    { initializer: "initialize", kind: "uups" }
  );
  await equityProxy.deployed();
  deployments.STLLCEquityToken = {
    proxy: equityProxy.address,
    impl:  await upgrades.erc1967.getImplementationAddress(equityProxy.address),
  };
  console.log(`    Proxy   : ${equityProxy.address}`);
  console.log(`    Impl    : ${deployments.STLLCEquityToken.impl}`);

  // ─── 2. STDealNote (ST-DEAL-008) ─────────────────────────────────────────────
  console.log("\n📋  Deploying STDealNote (ST-DEAL-008)...");
  const STDealNote = await ethers.getContractFactory("STDealNote");
  const dealNote = await STDealNote.deploy(
    usdcAddress,
    manager,
    CONFIG.DEAL_008.totalTokens,
    CONFIG.DEAL_008.faceValuePerToken,
    CONFIG.DEAL_008.repaymentPerToken,
    CONFIG.DEAL_008.maturityDate,
    CONFIG.DEAL_008.dealRef,
    CONFIG.DEAL_008.propertyAddress,
    CONFIG.DEAL_008.arvUSD
  );
  await dealNote.deployed();
  deployments.STDealNote008 = dealNote.address;
  console.log(`    Address : ${dealNote.address}`);

  // ─── 3. SHTXUtilityToken ─────────────────────────────────────────────────────
  console.log("\n⚡  Deploying SHTXUtilityToken...");
  const SHTXUtilityToken = await ethers.getContractFactory("SHTXUtilityToken");
  const shtx = await SHTXUtilityToken.deploy(manager);
  await shtx.deployed();
  deployments.SHTXUtilityToken = shtx.address;
  console.log(`    Address : ${shtx.address}`);

  // ─── 4. STDealTrackRecord (Soulbound NFT) ────────────────────────────────────
  console.log("\n🏆  Deploying STDealTrackRecord (Soulbound)...");
  const STDealTrackRecord = await ethers.getContractFactory("STDealTrackRecord");
  const trackRecord = await STDealTrackRecord.deploy(manager);
  await trackRecord.deployed();
  deployments.STDealTrackRecord = trackRecord.address;
  console.log(`    Address : ${trackRecord.address}`);

  // ─── 5. KhakiSolLoyalty (ERC-1155) ───────────────────────────────────────────
  console.log("\n🎖️  Deploying KhakiSolLoyalty (ERC-1155)...");
  const KhakiSolLoyalty = await ethers.getContractFactory("KhakiSolLoyalty");
  const loyalty = await KhakiSolLoyalty.deploy(
    manager,
    "https://api.khakisol.com/metadata/{id}.json"
  );
  await loyalty.deployed();
  deployments.KhakiSolLoyalty = loyalty.address;
  console.log(`    Address : ${loyalty.address}`);

  // ─── 6. STSpreadCollection (15-token ERC-1155) ───────────────────────────────
  console.log("\n💎  Deploying STSpreadCollection (15-token spread collection)...");
  const STSpreadCollection = await ethers.getContractFactory("STSpreadCollection");
  const spreadCollection = await STSpreadCollection.deploy(
    usdcAddress,
    manager,
    "https://api.stllc.com/spread-collection/metadata/{id}.json"
  );
  await spreadCollection.deployed();
  deployments.STSpreadCollection = spreadCollection.address;
  console.log(`    Address : ${spreadCollection.address}`);
  console.log(`    IDs 1-5  : Deal Note NFTs (USDC yield, Reg D 506c)`);
  console.log(`    IDs 6-10 : KhakiSol Product NFTs (5% royalty)`);
  console.log(`    IDs 11-15: Spread Badges (SHTX accrual + transfer cooldown)`);

  // ─── Save deployment manifest ─────────────────────────────────────────────────
  const manifest = {
    network:   network.name,
    chainId,
    deployer:  deployer.address,
    manager,
    usdc:      usdcAddress,
    timestamp: new Date().toISOString(),
    contracts: deployments,
  };

  const outPath = path.join(__dirname, `../deployments/${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄  Deployment manifest saved: ${outPath}`);

  // Also copy to frontend/public/deployments/ so Vite dev server can serve it
  const feDeployDir = path.join(__dirname, `../frontend/public/deployments`);
  fs.mkdirSync(feDeployDir, { recursive: true });
  const feOutPath = path.join(feDeployDir, `${network.name}.json`);
  fs.writeFileSync(feOutPath, JSON.stringify(manifest, null, 2));
  console.log(`📄  Frontend copy saved:       ${feOutPath}`);

  // ─── Sequence Builder import instructions ────────────────────────────────────
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║  SEQUENCE BUILDER — Import these contracts             ║");
  console.log("╠═══════════════════════════════════════════════════════╣");
  console.log(`║  STLLCEquityToken  : ${deployments.STLLCEquityToken.proxy}  ║`);
  console.log(`║  STDealNote008     : ${deployments.STDealNote008}  ║`);
  console.log(`║  SHTXUtilityToken  : ${deployments.SHTXUtilityToken}  ║`);
  console.log(`║  STDealTrackRecord : ${deployments.STDealTrackRecord}  ║`);
  console.log(`║  KhakiSolLoyalty   : ${deployments.KhakiSolLoyalty}  ║`);
  console.log(`║  STSpreadCollection: ${deployments.STSpreadCollection}  ║`);
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("\n  1. Go to https://sequence.build");
  console.log("  2. Create project: stllcweb3");
  console.log("  3. Settings → Contracts → Import existing contract");
  console.log("  4. Paste each address above + paste ABI from artifacts/");
  console.log("  5. Assign collaborators with READ or WRITE permissions");
  console.log("  6. Use Builder dashboard for read/write function execution\n");

  return manifest;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
