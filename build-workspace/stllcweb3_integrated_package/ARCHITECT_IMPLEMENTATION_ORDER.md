# STLLCWeb3 Architect Build Order

1. Run Supabase migration `001_web3_core_schema.sql`.
2. Add `.env.local` from `.env.example`.
3. Install required frontend deps: `@supabase/supabase-js`, wallet packages, and UI components.
4. Add wallet connect buttons for MetaMask and Sequence.
5. Upsert connected wallet into `wallets` after Supabase auth session exists.
6. Seed deployed contracts into `contracts`.
7. Mount dashboard routes:
   - `/dashboard/contracts`
   - `/dashboard/agents`
8. Connect agent calls to `agent_logs`.
9. Deploy to Render or Railway.
10. Before investor use: tighten RLS policies, add KYC/AML gates, and legal disclosure controls.
