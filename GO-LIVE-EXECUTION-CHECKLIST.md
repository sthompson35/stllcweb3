# STLLCWeb3 GO-LIVE EXECUTION CHECKLIST

Complete this checklist to deploy STLLCWeb3 to production. All phases build upon previous ones — complete in order.

## ⏸️ PHASE 0: PRE-LAUNCH VALIDATION

- [ ] **0.1 — Security audit completed**
  - [ ] All 6 smart contracts reviewed
  - [ ] No known vulnerabilities (OpenZeppelin audits, external review recommended for mainnet)
  - [ ] Private keys stored securely (hardware wallet or vault)
  - **References:** See `GO-LIVE-STRATEGY.md` → Phase 0

- [ ] **0.2 — Staging environment validated**
  - [ ] All workflows passing CI/CD
  - [ ] Frontend builds without errors
  - [ ] Contracts compile and pass all 32 tests
  - **Command:** `npm test` (all passing)

- [ ] **0.3 — Contracts deployed to Polygon Amoy testnet**
  - [ ] 6 contracts deployed successfully
  - [ ] Addresses saved to `deployments/amoy.json`
  - [ ] All contracts verified on Polygonscan
  - **Reference:** `GO-LIVE-STRATEGY.md` → Phase 0 → Contract Deployment

---

## ☑️ PHASE 1: GITHUB & ENVIRONMENT SETUP

Complete this phase before any automated deployments can run.

### Step 1.1 — Add 5 GitHub Secrets

**Timeline:** ~15 minutes (obtain credentials, add to GitHub)

**What to do:**
1. Read: `QUICK-START-SECRETS.md` (step-by-step checklist)
   OR `GITHUB-SECRETS-SETUP.md` (detailed reference)

2. Obtain all 5 values:
   - [ ] `DEPLOYER_PRIVATE_KEY` — Wallet private key (Amoy funded)
   - [ ] `POLYGON_AMOY_RPC_URL` — Alchemy/Infura Amoy RPC endpoint
   - [ ] `VERCEL_TOKEN` — Personal access token for Vercel
   - [ ] `RENDER_API_KEY` — Render API authentication token
   - [ ] `RENDER_SERVICE_ID` — Render webhook service ID

3. Add to GitHub:
   - Go to: https://github.com/sthompson35/stllcweb3/settings/secrets/actions
   - Click "New repository secret" × 5
   - Copy exact values from guides

4. Verify all 5 appear in settings (value shown as ●●●●●●●●●●)

**Status Check:**
```bash
# This will fail locally but works in GitHub Actions:
node scripts/validate-github-secrets.js
```

### Step 1.2 — Create Supabase Project

**Timeline:** ~5 minutes

1. Go to: https://supabase.com/dashboard
2. Create new project:
   - **Name:** stllcweb3-staging
   - **Region:** us-east-1 (or nearest)
   - **Password:** Generate strong password
3. Wait for provisioning (~2 min)
4. Copy credentials:
   - [ ] `SUPABASE_URL` → `https://xxx.supabase.co`
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` → Long JWT token
   - [ ] `SUPABASE_ANON_KEY` → Public key

5. Add to local `.env`:
   ```bash
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   SUPABASE_ANON_KEY=eyJ...
   ```

### Step 1.3 — Run Supabase Migrations

**Timeline:** ~2 minutes

```bash
# From repository root:
node scripts/supabase-setup.js
```

**Expected output:**
```
✅ All migrations applied.

Next steps:
1. supabase gen types typescript --project-id YOUR_PROJECT_ID > frontend/src/types/supabase.ts
2. Add SUPABASE_URL + SUPABASE_ANON_KEY to frontend/.env
```

---

## 🚀 PHASE 2: TESTNET DEPLOYMENT (Polygon Amoy)

Complete this phase to test the full CI/CD pipeline end-to-end.

### Step 2.1 — Deploy Contracts to Amoy Testnet

**Timeline:** ~5 minutes

1. Go to GitHub Actions: https://github.com/sthompson35/stllcweb3/actions/workflows/deploy-contracts-amoy.yml

2. Click "Run workflow" button

3. Fill in:
   - `confirm` field: type exactly `DEPLOY`
   - `verify` field: check "true"
   - Click "Run workflow"

4. Wait for completion (~3-5 min)

5. Check output for deployed contract addresses:
   ```
   CONTRACT_EQUITY = 0x...
   CONTRACT_NOTE = 0x...
   CONTRACT_SHTX = 0x...
   CONTRACT_TRACK = 0x...
   CONTRACT_LOYALTY = 0x...
   ```

6. Verify on Polygonscan: https://amoy.polygonscan.com/

**Success Criteria:**
- ✅ All 6 contracts deployed
- ✅ All contracts verified on Polygonscan
- ✅ Addresses stored in `deployments/amoy.json`

### Step 2.2 — Test CI/CD Pipeline

**Timeline:** ~10 minutes

1. Make a small commit to main:
   ```bash
   echo "# Testnet deployment $(date)" >> README.md
   git add README.md
   git commit -m "test: trigger ci/cd pipeline"
   git push origin main
   ```

2. Watch workflows: https://github.com/sthompson35/stllcweb3/actions

3. Expected workflow sequence:
   - ✅ **CI** — Tests, lint, build (2-3 min)
   - ✅ **Deploy Staging** — Frontend (Vercel) + Webhook (Render) (3-5 min)
   - ✅ **E2E Tests** — Playwright tests (3-5 min)

4. Verify deployments:
   - Frontend: Check Vercel project dashboard
   - Webhook: Check Render service dashboard
   - Check staging URL in workflow logs

---

## 🏗️ PHASE 3: MODULAR PACKAGES

Apply the 6 modular packages in strict order. Each adds features and integrations.

### Package Application Order

**⚠️ CRITICAL: Apply in this exact order**

1. **integrated** — Base Web3 + Supabase + Dashboard
2. **architect** — Smart contract registry + Agent monitoring
3. **agent_live** — Live OpenAI agents + Agent logs
4. **security** — Rate limiting, input validation, RLS policies
5. **onboarding** — KYC/AML gates (stub provider)
6. **private_capital** — e-signature + document storage (stub provider)

### Step 3.1 — Integrated Package

**Timeline:** ~5 minutes

```bash
# From repo root:
bash build-workspace/stllcweb3_integrated_package/scripts/apply_architect_package.sh .
```

**What it adds:**
- Supabase schema: wallets, contracts, agent_logs
- React components: Dashboard, WalletConnectButtons
- Wallet auth integration
- Contract registry

**Verify:**
```bash
npm run dev
# Open http://localhost:5173/dashboard/contracts
# You should see contract registry
```

**Commit:**
```bash
git add .
git commit -m "feat: apply integrated package (supabase schema, dashboard, wallet auth)"
git push
```

### Step 3.2 — Architect Package

**Timeline:** ~3 minutes

```bash
# Copy files from architect package manually:
cp build-workspace/stllcweb3_architect_package/src/components/AgentMonitor.tsx src/components/
cp build-workspace/stllcweb3_architect_package/src/config/contracts.ts src/config/
# ... (see ARCHITECT_IMPLEMENTATION_ORDER.md for full list)
```

**What it adds:**
- Agent monitoring dashboard
- Contract registry component
- Smart contract call tracking

**Commit & Push**

### Step 3.3 — Agent Live Package

**Timeline:** ~5 minutes

**What it adds:**
- OpenAI API integration
- Live agent orchestration
- Real-time agent logs

**Requires:** `OPENAI_API_KEY` in `.env`

### Step 3.4 — Security Package

**Timeline:** ~5 minutes

**What it adds:**
- Rate limiting middleware
- Input validation & sanitization
- Enhanced RLS policies (Supabase)
- CSRF protection

### Step 3.5 — Onboarding Package

**Timeline:** ~10 minutes (includes stub replacement)

**What it adds:**
- KYC/AML verification flow
- Investor whitelisting
- Document upload

**TODO:** Replace KYC stub with real provider:
- [ ] Onfido, Jumio, or IDology integration
- Update: `src/lib/kyc/verify.js`

### Step 3.6 — Private Capital Package

**Timeline:** ~10 minutes (includes stub replacement)

**What it adds:**
- e-signature workflow
- Deal document storage (Supabase Storage)
- Investor agreement signing

**TODO:** Replace e-signature stub with real provider:
- [ ] DocuSign, Dropbox Sign, or PandaDoc integration
- Update: `src/lib/esignature/sign.js`

**Verify all packages applied:**
```bash
# Check for key files from each package:
test -f src/components/AgentMonitor.tsx && echo "✅ Architect"
test -f src/lib/openai-client.ts && echo "✅ Agent Live"
test -f src/middleware/rateLimit.ts && echo "✅ Security"
test -f src/lib/kyc/verify.js && echo "✅ Onboarding"
test -f src/lib/esignature/sign.js && echo "✅ Private Capital"
```

---

## 📋 PHASE 4: INTEGRATIONS & CONFIGURATION

Set up required third-party integrations.

### Step 4.1 — Supabase Storage Setup

**Timeline:** ~5 minutes

1. Go to: https://app.supabase.com → Storage

2. Create bucket: `deal-documents`
   - **Visibility:** Private
   - **File size limit:** 50 MB

3. Add RLS policy (via SQL Editor):
   ```sql
   CREATE POLICY "Authenticated users can upload documents"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'deal-documents');

   CREATE POLICY "Users can read their own documents"
   ON storage.objects
   FOR SELECT
   TO authenticated
   USING (bucket_id = 'deal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Step 4.2 — Create First Admin User

**Timeline:** ~2 minutes

1. Go to: Supabase Dashboard → Authentication → Users

2. Click "Add user" → Invite user

3. Enter email of first admin

4. Check `Set user as admin` checkbox

5. Copy verification link, open in browser

### Step 4.3 — (Optional) Replace KYC/AML Stub

**Timeline:** ~30 minutes (depends on provider)

**Recommended providers:**
- [ ] Onfido — Premium KYC, AI-powered ID verification
- [ ] Jumio — KYC + AML + Sanctions screening
- [ ] IDology — Affordable, instant verification

**Process:**
1. Sign up for provider, get API keys
2. Add API key to `.env.production`
3. Update `src/lib/kyc/verify.js` with real API calls
4. Test with staging wallet
5. Commit changes

### Step 4.4 — (Optional) Replace e-Signature Stub

**Timeline:** ~30 minutes (depends on provider)

**Recommended providers:**
- [ ] DocuSign — Industry standard, enterprise support
- [ ] Dropbox Sign — Developer-friendly, affordable
- [ ] PandaDoc — Template-based, integrated with Stripe

**Process:**
1. Sign up for provider, get API keys
2. Create signature template in provider dashboard
3. Add API key to `.env.production`
4. Update `src/lib/esignature/sign.js` with real API calls
5. Test signing workflow
6. Commit changes

---

## ✅ PHASE 5: LEGAL COMPLIANCE

Complete legal documentation before accepting real investors.

### Step 5.1 — Terms of Service

- [ ] Draft ToS covering:
  - [ ] Investor eligibility (accredited/non-accredited)
  - [ ] Risk disclaimers
  - [ ] Platform liability limitations
  - [ ] Use restrictions
  - [ ] Dispute resolution

- [ ] Have legal counsel review

- [ ] Publish to `/legal/terms.md`

### Step 5.2 — Privacy Policy

- [ ] GDPR compliance
- [ ] Data collection disclosure
- [ ] Third-party integrations (Supabase, OpenAI, Alchemy)
- [ ] Data retention policy
- [ ] User rights (access, deletion)

- [ ] Have legal counsel review

- [ ] Publish to `/legal/privacy.md`

### Step 5.3 — Risk Disclosure

- [ ] Smart contract risk
- [ ] Blockchain network risk (Polygon outages, etc.)
- [ ] Market risk (crypto volatility)
- [ ] Regulatory risk
- [ ] Counterparty risk (STLLC LLC solvency, etc.)

- [ ] Have legal counsel review

- [ ] Require investor acknowledgment during onboarding

---

## 🌍 PHASE 6: PRODUCTION DEPLOYMENT

Deploy to Polygon mainnet with canary rollout.

### Step 6.1 — Prepare Production Environment

**Timeline:** ~30 minutes

1. Create Supabase production project
   - Follow Step 1.2, name it `stllcweb3-production`
   - Copy credentials

2. Add production environment variables:
   ```bash
   cp .env.staging .env.production
   # Edit .env.production:
   NODE_ENV=production
   POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
   POLYGON_AMOY_RPC_URL=                    # (not used in prod)
   SUPABASE_URL=https://xxxxx.supabase.co   # (production project)
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   # ... (fill all keys)
   ```

3. Create additional GitHub Secrets for production:
   - `PROD_DEPLOYER_PRIVATE_KEY` — Mainnet deployer wallet
   - `PROD_SUPABASE_URL` — Production Supabase URL
   - `PROD_SUPABASE_SERVICE_ROLE_KEY`

### Step 6.2 — Deploy Contracts to Polygon Mainnet

**Timeline:** ~10 minutes

1. Ensure deployer wallet has 10+ POL for gas

2. Create GitHub Actions workflow: `.github/workflows/deploy-contracts-mainnet.yml`
   - (Similar to `deploy-contracts-amoy.yml` but with production env)

3. Trigger workflow manually:
   - Go to: Actions → Deploy Contracts Mainnet
   - Type `DEPLOY-MAINNET` to confirm
   - Wait for completion

4. Record contract addresses from logs
   - Update `.env.production`
   - Commit & push

### Step 6.3 — Run Health Check

**Timeline:** ~2 minutes

```bash
node scripts/health-check.js --env production
```

**Expected output:**
```
✅ Frontend: 200 OK
✅ Webhook: /health responding
✅ Supabase: API reachable
✅ All required env vars set
Status: READY FOR PRODUCTION
```

### Step 6.4 — Canary Deployment (10% Traffic)

**Timeline:** ~5 minutes

**Steps:**
1. Deploy to Vercel + Render (via GitHub Actions)
2. Configure load balancer for 10% traffic to production
3. Monitor error rates, response times
4. Duration: 30 minutes

**Success criteria:**
- Error rate < 0.1%
- P95 latency < 2s
- No contract failures

**Reference:** `GO-LIVE-STRATEGY.md` → Phase 1 → Canary Deployment

### Step 6.5 — Canary Deployment (50% Traffic)

**Timeline:** ~5 minutes

**If 10% canary passes:**
1. Increase traffic to 50%
2. Monitor for 1 hour
3. Watch incident dashboard

**Success criteria:** Same as above

### Step 6.6 — Full Production Rollout (100% Traffic)

**Timeline:** ~5 minutes

**If 50% canary passes:**
1. Route 100% traffic to production
2. Monitor 24/7 (see Phase 2 → Launch Monitoring)
3. Be ready for rollback

**Reference:** `GO-LIVE-STRATEGY.md` → Phase 2 → Launch Monitoring

---

## 📊 PHASE 7: LAUNCH MONITORING & INCIDENT RESPONSE

Active monitoring for the first 24-48 hours post-launch.

### Step 7.1 — Set Up Monitoring Dashboard

**Deploy monitoring stack:**

```bash
# Start Prometheus + Grafana (in Docker):
docker-compose -f docker-compose.prod.yml up -d

# Access:
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
```

### Step 7.2 — Configure Alerts

**Set alerts for:**
- [ ] Contract failure (tx reverts)
- [ ] Webhook timeouts (> 5s)
- [ ] Supabase connection errors
- [ ] OpenAI API failures
- [ ] Rate limiter activation
- [ ] Database lock-ups
- [ ] Out of memory

**Reference:** `INCIDENT-RESPONSE.md` → Escalation & Alerts

### Step 7.3 — 24/7 Incident Response

**If production issue occurs:**

1. **Assess severity:** CRITICAL / WARNING / INFO

2. **Follow playbook:** `INCIDENT-RESPONSE.md`

3. **Communicate status:** Investor updates, status page

4. **Rollback if needed:**
   ```bash
   # Revert to staging:
   git revert <bad-commit>
   git push
   # GitHub Actions will auto-deploy
   ```

5. **Post-mortem:** Document root cause, prevention

**Reference:** `INCIDENT-RESPONSE.md` → Response Procedures

---

## ✨ COMPLETION CHECKLIST

Mark all items as complete when entire go-live is finished:

- [ ] Phase 0 — Pre-launch validation ✅
- [ ] Phase 1 — GitHub & environment setup ✅
- [ ] Phase 2 — Testnet deployment ✅
- [ ] Phase 3 — Modular packages applied ✅
- [ ] Phase 4 — Integrations configured ✅
- [ ] Phase 5 — Legal compliance reviewed ✅
- [ ] Phase 6 — Production deployment (canary → 100%) ✅
- [ ] Phase 7 — 48hr monitoring complete ✅

**Launch Day Success Criteria:**
- ✅ 0 critical incidents
- ✅ < 0.01% error rate (< 1 error per 10,000 requests)
- ✅ P95 latency < 2 seconds
- ✅ All 6 contracts functional
- ✅ Investor KYC successful
- ✅ First deal executed on mainnet

**Sign-Off:**
- [ ] CEO approval (Shylow Thompson)
- [ ] Technical lead sign-off
- [ ] Legal review complete
- [ ] Compliance check passed

---

## 📚 REFERENCE DOCUMENTS

Read these for detailed guidance:

- **Strategy** → `GO-LIVE-STRATEGY.md` (7 phases, timelines, go/no-go matrix)
- **Incident Response** → `INCIDENT-RESPONSE.md` (playbook for production issues)
- **GitHub Secrets** → `QUICK-START-SECRETS.md` (checklist) or `GITHUB-SECRETS-SETUP.md` (detailed)
- **Deployment Recommendations** → `DEPLOYMENT_RECOMMENDATIONS.md` (architecture, best practices)

---

## 🆘 SUPPORT

If you encounter issues:

1. **Check logs:**
   ```bash
   # Contracts:
   npx hardhat run scripts/verify-deployment.js --network polygonAmoy
   
   # Supabase:
   supabase logs
   
   # Frontend:
   npm run dev  # Check browser console
   
   # Webhook:
   # Check Render service logs
   ```

2. **Consult incident playbook:**
   → `INCIDENT-RESPONSE.md` → Common Scenarios

3. **Escalate:**
   - [ ] Check GitHub Actions workflows for errors
   - [ ] Review security audit findings
   - [ ] Contact Render/Vercel support for deployment issues
   - [ ] Contact Supabase support for database issues

---

**Last Updated:** July 2, 2026
**Status:** Ready for Phase 1 Execution
**Next Step:** Add 5 GitHub Secrets (QUICK-START-SECRETS.md)

