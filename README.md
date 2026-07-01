# stllcweb3

**Shylow Thompson LLC — Web3 Smart Contract Suite**
Missouri real estate investment + KhakiSol tactical gear — fully tokenized on Polygon.

---

## Architecture

```
stllcweb3/
├── contracts/
│   ├── core/
│   │   ├── STLLCEquityToken.sol      ERC-20 · UUPS · ERC-3643 compliance · profit distribution
│   │   ├── STDealNote.sol            ERC-20 · fixed-term bond per deal · auto-repayment
│   │   ├── SHTXUtilityToken.sol      ERC-20 · community utility · KhakiSol loyalty currency
│   │   ├── STDealTrackRecord.sol     ERC-721 · soulbound (ERC-5192) · on-chain deal history
│   │   └── KhakiSolLoyalty.sol      ERC-1155 · badges + product NFTs + ERC-2981 royalties
│   └── libraries/
│       └── MockUSDC.sol              Test only
├── scripts/
│   └── deploy.js                    Full deployment + Sequence Builder instructions
├── test/
│   └── stllcweb3.test.js            20 security + functional tests
├── frontend/src/
│   └── index.html                   Operations dashboard
├── deployments/                     Auto-generated manifests per network
├── hardhat.config.js
└── package.json
```

---

## Contract Summary

| Contract | Standard | Purpose |
|---|---|---|
| STLLCEquityToken | ERC-20 + ERC-3643 + UUPS | LLC equity, profit distribution, governance |
| STDealNote | ERC-20 | Fixed-term deal bond (12% APY, 6-month term) |
| SHTXUtilityToken | ERC-20 | Community utility token for both businesses |
| STDealTrackRecord | ERC-721 + ERC-5192 | Soulbound deal history NFT |
| KhakiSolLoyalty | ERC-1155 + ERC-2981 | Multi-tier loyalty badges + product drops |

---

## Quick Start

```bash
# Install
npm install

# Environment
cp .env.example .env
# Fill in DEPLOYER_PRIVATE_KEY, MANAGER_WALLET, POLYGON_RPC_URL

# Test (all 20 tests must pass before mainnet)
npx hardhat test

# Deploy testnet
npx hardhat run scripts/deploy.js --network polygonAmoy

# Deploy mainnet (after audit)
npx hardhat run scripts/deploy.js --network polygon
```

---

## Sequence Builder Integration

1. Go to **sequence.build** and create project `stllcweb3`
2. Settings → Contracts → Import existing contract
3. Paste each deployed address from `deployments/polygonAmoy.json`
4. Assign collaborators: compliance team (COMPLIANCE_ROLE), investors (read-only)
5. Use Builder dashboard for read/write function execution — no code required
6. Enable Sequence Wallet for gasless investor onboarding (email login)

---

## Security Model

- **UUPS upgradeable** on equity token — emergency patch path, UPGRADER_ROLE only
- **Pausable** on all contracts — emergency stop via PAUSER_ROLE
- **ERC-3643 whitelist** — transfers blocked for non-KYC wallets
- **ReentrancyGuard** on all USDC-handling functions
- **Pull pattern** on reward claims — no push attack surface
- **Block-snapshot voting** — blocks flash loan governance attacks
- **Rate-limited minting** on SHTX — prevents utility token abuse
- **Soulbound (ERC-5192)** on track record — non-transferable deal history
- **SafeERC20** on all token transfers
- **Least privilege** — role-based access, no omnipotent owner

### Pre-Mainnet Audit Required
Deploy to Amoy testnet, run full test suite, then engage a third-party auditor
(Certik, OpenZeppelin, Trail of Bits) before Polygon mainnet deployment.

---

## Token Economics

### STLLCEquityToken (STLLC)
- Total supply: 10,000 tokens
- Manager: 8,000 (80%) — Shylow Thompson
- Investor pool: 2,000 (20%) — sold at $100/token = $200,000 raised
- Distribution: 20% of quarterly net profit in USDC, pro-rata
- Reg D 506(c) — accredited investors only — KYC via Parallel Markets

### STDealNote (ST-DEAL-008)
- Principal: $129,000 (1,290 tokens × $100 face value)
- Repayment: $106 per token at maturity
- Annual yield: 12% (6% over 6-month term)
- Property: 142 Ridgewood Dr, De Soto, MO — Jefferson County
- ARV: $195,000

### SHTXUtilityToken (SHTX)
- Max supply: 10,000,000
- Reward rate: 10 SHTX per $1 spent on KhakiSol
- Tiers: Scout (100) → Operator (500) → Trooper (2,000) → Commander (5,000)
- NOT a security — no investment return guarantee

---

## n8n Automation Integrations

- Shopify order.paid → KhakiSolLoyalty.mintSHTX()
- Purchase milestone → KhakiSolLoyalty.mintBadge()
- Deal close → STDealTrackRecord.mintDealRecord()
- Quarterly profit → STLLCEquityToken.depositDistribution()

---

## Legal

This codebase is a technical implementation only.
All token offerings must comply with applicable securities laws.
STLLCEquityToken and STDealNote are securities under Reg D 506(c).
Engage a securities attorney before offering to investors.
SHTXUtilityToken has no investment return and is not a security.

© 2026 Shylow Thompson LLC — All rights reserved.
