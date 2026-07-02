# STLLCWeb3 Phase 7 — Private Capital Infrastructure

## Mission
Add deal document vault, investor subscription workflow, e-signature provider stub, capital commitment tracking, private deal-room enhancements, and investor relations agent support.

## Apply Order

1. Copy this package into the root of `stllcweb3`.
2. Run the Supabase migration:
   ```bash
   supabase db push
   ```
   Or paste `supabase/migrations/007_private_capital_infrastructure.sql` into the Supabase SQL editor.

3. Create Supabase Storage bucket:
   - Bucket: `deal-documents`
   - Private: `true`
   - Public access: `false`

4. Confirm these prior tables exist:
   - `users`
   - `deals`
   - `agent_logs`
   - `investor_compliance_profiles`

5. Wire Supabase Auth session token into frontend:
   - Current placeholder reads `localStorage.supabase_access_token`.
   - Replace with your existing Supabase session provider before production.

6. Add route/page:
   - `/deals/[dealId]`

7. Test APIs:
   - `GET /api/deals/[dealId]/documents`
   - `GET /api/documents/[documentId]/download`
   - `POST /api/subscriptions`
   - `POST /api/signatures/create`
   - `POST /api/signatures/send`
   - `GET /api/signatures/status/[signatureRequestId]`
   - `POST /api/capital-commitments`

## Production Warnings

This package contains e-signature stubs only. Do not use internal stubs for legally binding investor documents. Connect DocuSign, Dropbox Sign, or PandaDoc and verify webhook signatures before public deployment.

This package does not create legal compliance. Use securities counsel for Reg D, Reg CF, Reg A, broker-dealer, investment adviser, and state blue-sky analysis.
