# GitHub Secrets Setup Guide

This document guides you through adding the 5 critical GitHub Secrets required for CI/CD deployment workflows.

## Overview of Required Secrets

| Secret | Used By | Description |
|--------|---------|-------------|
| `DEPLOYER_PRIVATE_KEY` | deploy-contracts-amoy, deploy-mainnet | Private key of wallet that deploys contracts to testnet/mainnet |
| `POLYGON_AMOY_RPC_URL` | deploy-contracts-amoy | RPC endpoint for Polygon Amoy testnet |
| `VERCEL_TOKEN` | deploy-staging, deploy-production | Personal access token for Vercel frontend deployments |
| `RENDER_API_KEY` | deploy-staging, deploy-production | API key for Render webhook server deployments |
| `RENDER_SERVICE_ID` | deploy-staging, deploy-production | Service ID of the Render webhook service to deploy |

---

## 1. DEPLOYER_PRIVATE_KEY

**What it is:** Private key (without 0x prefix) of an EVM wallet that will deploy contracts

**How to obtain:**
- Create a new wallet in MetaMask, Ledger, or similar
- OR use an existing deployer wallet
- Export the private key (keep this secure!)
- Remove the `0x` prefix if present
- Fund with:
  - **Amoy testnet**: 1-2 POL (free from faucet)
  - **Polygon mainnet** (later): 10-50 POL for gas

**Alternative - Use Hardhat:**
```bash
npx hardhat accounts
# Copy the first account private key, remove leading 0x
```

**Where to get testnet POL for Amoy:**
1. Go to https://www.alchemy.com/faucets/polygon-amoy
2. Connect wallet with MetaMask
3. Request 1 POL (gets deposited in ~30 seconds)

---

## 2. POLYGON_AMOY_RPC_URL

**What it is:** HTTP endpoint to connect to Polygon Amoy testnet

**How to obtain:**

### Option A: Use Alchemy (Recommended)
1. Go to https://dashboard.alchemy.com
2. Sign up or log in
3. Create a new **Polygon Amoy** app in your dashboard
4. Copy the HTTPS URL that looks like:
   ```
   https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
   ```

### Option B: Use Infura
1. Go to https://infura.io
2. Create account and new Polygon Amoy project
3. Copy the RPC URL

### Option C: Use QuickNode
1. Go to https://www.quicknode.com
2. Create Polygon Amoy endpoint
3. Copy HTTP provider URL

**Store as:** Full URL including API key

---

## 3. VERCEL_TOKEN

**What it is:** Personal access token for Vercel CLI deployments

**How to obtain:**
1. Go to https://vercel.com/account/settings/tokens
2. Sign in with your Vercel account
3. Click "Create Token"
4. Set:
   - **Token name:** `github-ci-stllcweb3` or similar
   - **Scope:** Full Account
   - **Expiration:** 90 days (renewable)
5. Copy the token immediately (you won't see it again)

**What it enables:**
- GitHub Actions to deploy frontend to Vercel staging/production
- Automatic URL generation and preview links

---

## 4. RENDER_API_KEY

**What it is:** API authentication token for Render.com infrastructure

**How to obtain:**
1. Go to https://dashboard.render.com
2. Log in to Render account
3. Go to **Settings → Tokens** (top right gear icon)
4. Click "Create API Key"
5. Set:
   - **Name:** `github-ci-stllcweb3`
   - Click "Create"
6. Copy the token immediately

**What it enables:**
- GitHub Actions to trigger webhook server deployments
- Redeploy without pushing code changes

---

## 5. RENDER_SERVICE_ID

**What it is:** Unique identifier of the Render webhook service to deploy

**How to obtain:**
1. Go to https://dashboard.render.com
2. Navigate to your **webhook service** in the left sidebar (or create one from render.yaml)
3. Look at the URL in the browser: `https://dashboard.render.com/services/srv_abc123xyz...`
4. The service ID is the part after `/services/` (e.g., `srv_abc123xyz`)
5. **Alternative:** Click "Settings" on the service and copy the service ID from the top

**Example:**
```
Service URL: https://dashboard.render.com/services/srv_12345abcde
Service ID: srv_12345abcde
```

---

## Adding Secrets to GitHub

### Via GitHub Web UI

1. Go to: https://github.com/sthompson35/stllcweb3/settings/secrets/actions

2. Click **"New repository secret"** for each:

3. Fill in the values:
   ```
   Name: DEPLOYER_PRIVATE_KEY
   Value: [paste private key from step 1]
   ```

   ```
   Name: POLYGON_AMOY_RPC_URL
   Value: https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
   ```

   ```
   Name: VERCEL_TOKEN
   Value: [paste token from step 3]
   ```

   ```
   Name: RENDER_API_KEY
   Value: [paste API key from step 4]
   ```

   ```
   Name: RENDER_SERVICE_ID
   Value: srv_xxxxx
   ```

4. Click "Add secret" after each

### Via GitHub CLI

If you have `gh` CLI installed:

```bash
gh secret set DEPLOYER_PRIVATE_KEY -b "$(cat /path/to/private/key)"
gh secret set POLYGON_AMOY_RPC_URL -b "https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY"
gh secret set VERCEL_TOKEN -b "vercel_token_here"
gh secret set RENDER_API_KEY -b "render_api_key_here"
gh secret set RENDER_SERVICE_ID -b "srv_xxxxx"
```

---

## Verification

After adding all 5 secrets, verify they appear in the GitHub UI:

1. Go to: https://github.com/sthompson35/stllcweb3/settings/secrets/actions

2. You should see all 5 secrets listed:
   - ✅ DEPLOYER_PRIVATE_KEY
   - ✅ POLYGON_AMOY_RPC_URL
   - ✅ VERCEL_TOKEN
   - ✅ RENDER_API_KEY
   - ✅ RENDER_SERVICE_ID

3. Next step: Trigger "Deploy Contracts → Amoy" workflow:
   - Go to: https://github.com/sthompson35/stllcweb3/actions/workflows/deploy-contracts-amoy.yml
   - Click "Run workflow"
   - Type `DEPLOY` in the confirmation prompt
   - Click "Run workflow"

---

## Security Best Practices

- ✅ Never commit secrets to `.git` or env files
- ✅ Rotate private keys quarterly
- ✅ Use separate deployer wallet for testnet vs mainnet
- ✅ Store offline backup in secure vault (1Password, Bitwarden, LastPass)
- ✅ GitHub encrypts secrets at rest, never displays them
- ✅ Re-create Vercel/Render tokens if exposed
- ✅ Monitor GitHub Actions logs for any leaks (logs are public!)

---

## Next Steps

1. Obtain all 5 values using the guides above
2. Add them to GitHub Secrets
3. Verify they appear in settings
4. Trigger "Deploy Contracts → Amoy" workflow to test
5. Proceed to mainnet deployment after Amoy tests pass

