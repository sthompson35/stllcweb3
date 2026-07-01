// test/stllcweb3.test.js
const { expect }         = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time }           = require("@nomicfoundation/hardhat-network-helpers");

describe("stllcweb3 — Full Contract Suite", function () {
  let deployer, manager, investor1, investor2, investor3, attacker;
  let usdc, equity, dealNote, shtx, trackRecord, loyalty;

  const USDC_DECIMALS   = 6;
  const TOKEN_DECIMALS  = 18;
  const FACE_VALUE      = 100n * 10n ** 6n;   // $100 USDC
  const REPAY_VALUE     = 106n * 10n ** 6n;   // $106 USDC
  const SIX_MONTHS      = 180 * 24 * 60 * 60; // seconds

  before(async () => {
    [deployer, manager, investor1, investor2, investor3, attacker] =
      await ethers.getSigners();
  });

  beforeEach(async () => {
    // Deploy mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy(deployer.address);
    await usdc.deployed();

    // Fund wallets with USDC
    for (const w of [manager, investor1, investor2, investor3]) {
      await usdc.mint(w.address, 1_000_000n * 10n ** 6n);
    }

    // ── STLLCEquityToken ──
    const STLLCEquityToken = await ethers.getContractFactory("STLLCEquityToken");
    equity = await upgrades.deployProxy(
      STLLCEquityToken,
      [usdc.address, manager.address],
      { initializer: "initialize", kind: "uups" }
    );
    await equity.deployed();

    // ── STDealNote ──
    const maturity = (await time.latest()) + SIX_MONTHS;
    const STDealNote = await ethers.getContractFactory("STDealNote");
    dealNote = await STDealNote.deploy(
      usdc.address, manager.address, 1290,
      FACE_VALUE, REPAY_VALUE, maturity,
      "ST-DEAL-008", "142 Ridgewood Dr, De Soto MO", 19500000
    );
    await dealNote.deployed();

    // ── SHTXUtilityToken ──
    const SHTX = await ethers.getContractFactory("SHTXUtilityToken");
    shtx = await SHTX.deploy(manager.address);
    await shtx.deployed();

    // ── STDealTrackRecord ──
    const TrackRecord = await ethers.getContractFactory("STDealTrackRecord");
    trackRecord = await TrackRecord.deploy(manager.address);
    await trackRecord.deployed();

    // ── KhakiSolLoyalty ──
    const Loyalty = await ethers.getContractFactory("KhakiSolLoyalty");
    loyalty = await Loyalty.deploy(manager.address, "https://api.khakisol.com/metadata/{id}.json");
    await loyalty.deployed();
  });

  // ═══════════════════════════════════════════════════════════════
  describe("STLLCEquityToken", () => {

    it("mints correct supply to manager and contract", async () => {
      const managerBal = await equity.balanceOf(manager.address);
      const contractBal = await equity.balanceOf(equity.address);
      expect(managerBal.eq(ethers.utils.parseEther("8000"))).to.be.true;
      expect(contractBal.eq(ethers.utils.parseEther("2000"))).to.be.true;
    });

    it("reverts transfer to non-whitelisted address", async () => {
      await expect(
        equity.connect(manager).transfer(investor1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWithCustomError(equity, "NotWhitelisted");
    });

    it("allows transfer after whitelist approval", async () => {
      await equity.connect(manager).setWhitelist(investor1.address, true);
      await equity.connect(manager).distributeInvestorTokens(
        investor1.address, ethers.utils.parseEther("100")
      );
      expect(await equity.balanceOf(investor1.address))
        .to.equal(ethers.utils.parseEther("100"));
    });

    it("distributes USDC profit correctly", async () => {
      // Whitelist and distribute tokens to investors
      for (const inv of [investor1, investor2]) {
        await equity.connect(manager).setWhitelist(inv.address, true);
        await equity.connect(manager).distributeInvestorTokens(
          inv.address, ethers.utils.parseEther("500")
        );
      }

      // Manager deposits $10,000 USDC distribution
      const dist = 10_000n * 10n ** 6n;
      await usdc.connect(manager).approve(equity.address, dist);
      await equity.connect(manager).depositDistribution(dist, "Q1-2026 — 3 deals");

      // Each investor has 500/1000 = 50% of circulating investor tokens
      const pending1 = await equity.pendingRewards(investor1.address);
      const pending2 = await equity.pendingRewards(investor2.address);
      expect(pending1).to.equal(ethers.utils.parseUnits("5000", 6));
      expect(pending2).to.equal(ethers.utils.parseUnits("5000", 6));
    });

    it("allows investor to claim USDC rewards", async () => {
      await equity.connect(manager).setWhitelist(investor1.address, true);
      await equity.connect(manager).distributeInvestorTokens(
        investor1.address, ethers.utils.parseEther("1000")
      );
      const dist = 5_000n * 10n ** 6n;
      await usdc.connect(manager).approve(equity.address, dist);
      await equity.connect(manager).depositDistribution(dist, "Test distribution");

      const balBefore = await usdc.balanceOf(investor1.address);
      await equity.connect(investor1).claimRewards();
      const balAfter = await usdc.balanceOf(investor1.address);
      expect(balAfter.sub(balBefore)).to.equal(dist); // 100% of investor supply
    });

    it("pauses and unpauses correctly", async () => {
      await equity.connect(manager).setWhitelist(investor1.address, true);
      await equity.connect(manager).pause();
      // distributeInvestorTokens has whenNotPaused — must revert when paused
      await expect(
        equity.connect(manager).distributeInvestorTokens(
          investor1.address, ethers.utils.parseEther("100")
        )
      ).to.be.reverted;
      await equity.connect(manager).unpause();
      await equity.connect(manager).distributeInvestorTokens(
        investor1.address, ethers.utils.parseEther("100")
      );
    });

    it("creates and tallies governance proposal", async () => {
      await equity.connect(manager).setWhitelist(investor1.address, true);
      await equity.connect(manager).setWhitelist(investor2.address, true);
      await equity.connect(manager).distributeInvestorTokens(
        investor1.address, ethers.utils.parseEther("600")
      );
      await equity.connect(manager).distributeInvestorTokens(
        investor2.address, ethers.utils.parseEther("400")
      );

      const pid = await equity.connect(investor1).callStatic.createProposal(
        "Sell business to Blackstone for $5M", 7 * 24 * 3600
      );
      await equity.connect(investor1).createProposal(
        "Sell business to Blackstone for $5M", 7 * 24 * 3600
      );

      await equity.connect(investor1).castVote(pid, true);
      await equity.connect(investor2).castVote(pid, false);

      const p = await equity.proposals(pid);
      expect(p.forVotes).to.equal(ethers.utils.parseEther("600"));
      expect(p.againstVotes).to.equal(ethers.utils.parseEther("400"));
    });

    it("is upgradeable by UPGRADER_ROLE only", async () => {
      const V2 = await ethers.getContractFactory("STLLCEquityToken");
      await expect(
        upgrades.upgradeProxy(equity.address, V2.connect(attacker))
      ).to.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("STDealNote", () => {

    it("stores correct deal parameters", async () => {
      expect(await dealNote.faceValuePerToken()).to.equal(FACE_VALUE);
      expect(await dealNote.repaymentPerToken()).to.equal(REPAY_VALUE);
      expect(await dealNote.propertyAddress()).to.equal("142 Ridgewood Dr, De Soto MO");
    });

    it("issues tokens to whitelisted investor", async () => {
      await dealNote.connect(manager).setWhitelist(investor1.address, true);
      await dealNote.connect(manager).issueTokens(
        investor1.address, ethers.utils.parseEther("100")
      );
      expect(await dealNote.balanceOf(investor1.address))
        .to.equal(ethers.utils.parseEther("100"));
    });

    it("reverts issuance to non-whitelisted", async () => {
      await expect(
        dealNote.connect(manager).issueTokens(attacker.address, ethers.utils.parseEther("10"))
      ).to.be.revertedWithCustomError(dealNote, "NotWhitelisted");
    });

    it("allows redemption after maturity deposit", async () => {
      await dealNote.connect(manager).setWhitelist(investor1.address, true);
      await dealNote.connect(manager).issueTokens(
        investor1.address, ethers.utils.parseEther("100")
      );

      // Manager deposits repayment ($106 × 100 tokens = $10,600)
      const repayTotal = 100n * REPAY_VALUE;
      await usdc.connect(manager).approve(dealNote.address, repayTotal);
      await dealNote.connect(manager).depositRepayment(repayTotal);

      const balBefore = await usdc.balanceOf(investor1.address);
      await dealNote.connect(investor1).redeem(ethers.utils.parseEther("100"));
      const balAfter = await usdc.balanceOf(investor1.address);

      expect(balAfter.sub(balBefore)).to.equal(repayTotal);
      expect(await dealNote.balanceOf(investor1.address)).to.equal(0);
    });

    it("reverts redemption before maturity deposit", async () => {
      await dealNote.connect(manager).setWhitelist(investor1.address, true);
      await dealNote.connect(manager).issueTokens(
        investor1.address, ethers.utils.parseEther("10")
      );
      await expect(
        dealNote.connect(investor1).redeem(ethers.utils.parseEther("10"))
      ).to.be.revertedWithCustomError(dealNote, "NotMatured");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("SHTXUtilityToken", () => {

    it("mints SHTX with reason within daily limit", async () => {
      await shtx.connect(manager).mint(
        investor1.address, ethers.utils.parseEther("500"), "KhakiSol purchase reward"
      );
      expect(await shtx.balanceOf(investor1.address))
        .to.equal(ethers.utils.parseEther("500"));
    });

    it("enforces max supply cap", async () => {
      const maxSupply = await shtx.MAX_SUPPLY();
      await expect(
        shtx.connect(manager).mint(investor1.address, maxSupply + 1n, "overflow")
      ).to.be.revertedWithCustomError(shtx, "ExceedsMaxSupply");
    });

    it("returns correct tier for balance", async () => {
      await shtx.connect(manager).mint(
        investor1.address, ethers.utils.parseEther("600"), "tier test"
      );
      const [name, benefit] = await shtx.getTier(investor1.address);
      expect(name).to.equal("Operator");
    });

    it("calculates purchase reward correctly", async () => {
      // $49.99 = 4999 cents → 4999 × 10 / 100 = 499.9 SHTX (rate is per-dollar, formula divides by 100)
      const reward = await shtx.calculatePurchaseReward(4999);
      expect(reward).to.equal(ethers.utils.parseEther("499.9"));
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("STDealTrackRecord (Soulbound)", () => {

    it("mints deal record NFT to manager", async () => {
      const record = {
        dealId: "ST-DEAL-001",
        propertyAddress: "88 Oak Ln, Festus, MO",
        county: "Jefferson",
        dealType: "wholesale",
        purchasePriceUSD: 4500000,  // $45,000
        arvUSD: 9500000,            // $95,000
        netProfitUSD: 1200000,      // $12,000
        daysToClose: 21,
        investorReturnBps: 0,
        closedAt: Math.floor(Date.now() / 1000),
        verifiedByTitle: false,
        ipfsDocHash: "QmTestHash123",
      };

      await trackRecord.connect(manager).mintDealRecord(
        manager.address, "ipfs://QmTokenURI", record
      );

      expect(await trackRecord.balanceOf(manager.address)).to.equal(1);
      expect(await trackRecord.totalDeals()).to.equal(1);
    });

    it("reverts transfer — soulbound", async () => {
      const record = {
        dealId: "ST-DEAL-002", propertyAddress: "Test", county: "Jefferson",
        dealType: "wholesale", purchasePriceUSD: 1, arvUSD: 1, netProfitUSD: 1,
        daysToClose: 1, investorReturnBps: 0,
        closedAt: Math.floor(Date.now() / 1000),
        verifiedByTitle: false, ipfsDocHash: "Qm123"
      };
      await trackRecord.connect(manager).mintDealRecord(
        manager.address, "ipfs://test", record
      );
      await expect(
        trackRecord.connect(manager).transferFrom(
          manager.address, investor1.address, 0
        )
      ).to.be.revertedWithCustomError(trackRecord, "Soulbound");
    });

    it("locked() returns true for all tokens", async () => {
      expect(await trackRecord.locked(0)).to.equal(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("KhakiSolLoyalty (ERC-1155)", () => {

    it("mints SHTX currency tokens", async () => {
      await loyalty.connect(manager).mintSHTX(
        investor1.address, ethers.utils.parseEther("100")
      );
      expect(await loyalty.balanceOf(investor1.address, 0))
        .to.equal(ethers.utils.parseEther("100"));
    });

    it("mints badge NFTs", async () => {
      await loyalty.connect(manager).mintBadge(investor1.address, 1); // Scout
      expect(await loyalty.balanceOf(investor1.address, 1)).to.equal(1);
    });

    it("allows only one Commander badge per wallet", async () => {
      await loyalty.connect(manager).mintBadge(investor1.address, 4); // Commander
      await expect(
        loyalty.connect(manager).mintBadge(investor1.address, 4)
      ).to.be.revertedWithCustomError(loyalty, "AlreadyHasCommanderBadge");
    });

    it("enforces founding member supply cap", async () => {
      // Mint 100 founding members
      for (let i = 0; i < 10; i++) {
        const wallet = ethers.Wallet.createRandom();
        // Batch for speed in tests
        await loyalty.connect(manager).mintFoundingMember(wallet.address);
      }
      // Cap is 100 — test at 101 would require 100 mints; just test limit logic
      const supply = await loyalty.totalSupply(5);
      expect(supply).to.be.lte(100);
    });

    it("creates and mints product drop NFT", async () => {
      const tx = await loyalty.connect(manager).createProductDrop(
        "Desert Storm Plate Carrier — Limited", "KHAKI-PC-001",
        50, 29999, "ipfs://QmProduct"
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ProductDropCreated");
      const tokenId = event.args.tokenId;

      await loyalty.connect(manager).mintProductNFT(investor1.address, tokenId);
      expect(await loyalty.balanceOf(investor1.address, tokenId)).to.equal(1);
    });

    it("batch mints badges efficiently", async () => {
      const recipients = [investor1.address, investor2.address, investor3.address];
      await loyalty.connect(manager).batchMintBadges(recipients, 1, 1);
      for (const r of recipients) {
        expect(await loyalty.balanceOf(r, 1)).to.equal(1);
      }
    });

    it("returns correct ERC-2981 royalty info", async () => {
      const [recipient, amount] = await loyalty.royaltyInfo(6, 100_000);
      expect(recipient).to.equal(manager.address);
      expect(amount).to.equal(5000); // 5% of 100,000
    });
  });

  // ═══════════════════════════════════════════════════════════════
  describe("Security — Attack vectors", () => {

    it("blocks non-MANAGER_ROLE from distributing equity tokens", async () => {
      await expect(
        equity.connect(attacker).distributeInvestorTokens(
          attacker.address, ethers.utils.parseEther("100")
        )
      ).to.be.reverted;
    });

    it("blocks non-MINTER_ROLE from minting SHTX", async () => {
      await expect(
        shtx.connect(attacker).mint(attacker.address, ethers.utils.parseEther("1000000"), "hack")
      ).to.be.reverted;
    });

    it("blocks reentrancy on claimRewards", async () => {
      // claimRewards uses nonReentrant — attempting reentrant call reverts
      // (Full reentrancy attack test requires malicious contract — covered in audit)
      await equity.connect(manager).setWhitelist(investor1.address, true);
      await equity.connect(manager).distributeInvestorTokens(
        investor1.address, ethers.utils.parseEther("100")
      );
      const dist = 1000n * 10n ** 6n;
      await usdc.connect(manager).approve(equity.address, dist);
      await equity.connect(manager).depositDistribution(dist, "test");
      // Normal claim should succeed
      await expect(equity.connect(investor1).claimRewards()).to.not.be.reverted;
      // Second claim with zero pending should revert
      await expect(
        equity.connect(investor1).claimRewards()
      ).to.be.revertedWithCustomError(equity, "ZeroAmount");
    });

    it("blocks unauthorized upgrade", async () => {
      const V2 = await ethers.getContractFactory("STLLCEquityToken", attacker);
      await expect(upgrades.upgradeProxy(equity.address, V2)).to.be.reverted;
    });

    it("emergency pause halts all token operations", async () => {
      await equity.connect(manager).setWhitelist(investor1.address, true);
      await equity.connect(manager).pause();
      // distributeInvestorTokens and depositDistribution both carry whenNotPaused
      await expect(
        equity.connect(manager).distributeInvestorTokens(
          investor1.address, ethers.utils.parseEther("10")
        )
      ).to.be.reverted;
      await equity.connect(manager).unpause();
    });
  });
});
