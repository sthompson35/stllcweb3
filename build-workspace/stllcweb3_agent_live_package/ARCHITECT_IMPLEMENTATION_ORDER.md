# STLLCWeb3 Live Agent + Sequence Integration Order

1. Copy this package into the `c:\stllcweb3` repo root.
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js 0xsequence
   ```
3. Add the environment values from `.env.example` / `deploy/railway.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY`
   - `NEXT_PUBLIC_DEFAULT_CHAIN_ID=80002`
4. Run the Supabase migration if it has not already been applied:
   ```bash
   supabase db push
   ```
5. Seed the contract registry:
   ```bash
   supabase db reset
   # or run supabase/seed/001_contract_registry_seed.sql manually in SQL editor
   ```
6. Start local dev:
   ```bash
   npm run dev
   ```
7. Open `/dashboard`.
8. Test MetaMask connection.
9. Test Sequence connection.
10. Ask each live agent a question and confirm rows are inserted into `agent_logs`.

## Added in this layer

- Real Sequence SDK connection through `0xsequence`.
- Live API route: `POST /api/agents/[agentKey]`.
- Server-side OpenAI call wrapper.
- Server-side Supabase service client.
- Automatic `agent_logs` inserts.
- Live dashboard agent panel that stores response logs.
- Wallet address handoff from wallet login to agent context.

## Production hardening still required

Before investor-facing deployment, add Supabase Auth session verification in the API route, tighter RLS, rate limiting, request audit trails, legal disclaimers, KYC/AML gates, and admin-only contract mutation controls.
