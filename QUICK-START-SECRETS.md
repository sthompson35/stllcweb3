# Quick Start Checklist — GitHub Secrets Setup

Complete this checklist to enable automated deployments.

## ☐ Step 1: Generate Deployer Wallet

Run this command to generate a test wallet for Amoy testnet:

```bash
npx hardhat accounts
```

Copy the first account private key (remove the `0x` prefix). Example output:
```
Account 0: 0x1234567890abcdef...
```

→ This is your `DEPLOYER_PRIVATE_KEY`

## ☐ Step 2: Fund Wallet on Amoy Testnet

1. Go to: https://www.alchemy.com/faucets/polygon-amoy
2. Connect your wallet (use the address from Step 1)
3. Request 1 POL
4. Wait ~30 seconds for confirmation

## ☐ Step 3: Get Polygon Amoy RPC URL

**Option A — Alchemy (Recommended):**
1. Go to: https://dashboard.alchemy.com
2. Create new Polygon Amoy app
3. Copy the HTTPS URL: `https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY`

**Option B — Free Public RPC:**
```
https://rpc-amoy.polygon.technology
```

→ This is your `POLYGON_AMOY_RPC_URL`

## ☐ Step 4: Create Vercel Token

1. Go to: https://vercel.com/account/settings/tokens
2. Create → Personal Tokens
3. Name: `github-ci`
4. Scope: Full Account
5. Copy the token immediately

→ This is your `VERCEL_TOKEN`

## ☐ Step 5: Create Render API Key

1. Go to: https://dashboard.render.com
2. Click gear (⚙️) → Account → API Key
3. Create API Key
4. Name: `github-ci`
5. Copy immediately

→ This is your `RENDER_API_KEY`

## ☐ Step 6: Get Render Service ID

1. Go to: https://dashboard.render.com
2. Click on your webhook service in the left sidebar
3. Look at the URL or Settings for the service ID
4. Format: `srv_xxxxx`

→ This is your `RENDER_SERVICE_ID`

## ☐ Step 7: Add Secrets to GitHub

1. Go to: https://github.com/sthompson35/stllcweb3/settings/secrets/actions

2. Click "New repository secret" × 5

3. Add each secret:
   - `DEPLOYER_PRIVATE_KEY` = (from Step 1)
   - `POLYGON_AMOY_RPC_URL` = (from Step 3)
   - `VERCEL_TOKEN` = (from Step 4)
   - `RENDER_API_KEY` = (from Step 5)
   - `RENDER_SERVICE_ID` = (from Step 6)

## ☐ Step 8: Verify Secrets in GitHub

Go to: https://github.com/sthompson35/stllcweb3/settings/secrets/actions

You should see all 5 secrets (values hidden as ●●●●●●●●●●)

## ☐ Step 9: Deploy Contracts to Amoy

1. Go to: https://github.com/sthompson35/stllcweb3/actions/workflows/deploy-contracts-amoy.yml

2. Click "Run workflow" button

3. In the popup:
   - `confirm` field: type `DEPLOY`
   - `verify` field: leave as default (true)
   - Click "Run workflow"

4. Wait for deployment (~3-5 minutes)

5. Check the workflow output for contract addresses

## ☐ Step 10: Update .env.staging with Contract Addresses

After Amoy deployment succeeds, you'll see contract addresses in the logs:

```
CONTRACT_EQUITY=0x...
CONTRACT_NOTE=0x...
CONTRACT_SHTX=0x...
CONTRACT_TRACK=0x...
CONTRACT_LOYALTY=0x...
```

Copy these to your local `.env.staging` file (for local development).

---

## ✅ Complete! Next Steps

Once all steps are done:

1. **Supabase Setup** (if not done):
   ```bash
   # Fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
   node scripts/supabase-setup.js
   ```

2. **Deploy to Staging** (automatic on main push):
   - Commits to `main` trigger CI → Frontend (Vercel) → Webhook (Render)

3. **E2E Tests**:
   ```bash
   npx playwright test
   ```

4. **Mainnet Deployment** (later):
   - Create `.env.production` with mainnet RPC
   - Run `init-mainnet.js` before deployment

---

## ⚠️ Security Reminders

- ✅ Never commit secrets to git
- ✅ Don't share private keys
- ✅ Rotate keys every 3 months
- ✅ GitHub Actions logs are public — check them for accidental leaks
- ✅ Use separate wallets for testnet vs mainnet
- ✅ Fund deployer wallets minimally (enough for gas only)

