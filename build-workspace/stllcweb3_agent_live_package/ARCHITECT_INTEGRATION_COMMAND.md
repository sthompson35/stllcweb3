# ARCHITECT Integration Command

Run from Windows PowerShell after unzipping this package:

```powershell
cd C:\stllcweb3
bash path\to\stllcweb3_integrated_package\scripts\apply_architect_package.sh .
npm install @supabase/supabase-js
copy .env.example .env.local
```

Then fill `.env.local` with Supabase, OpenAI, Alchemy, Sequence, and WalletConnect values.

Run Supabase migration and seed:

```powershell
supabase db push
supabase db execute --file supabase/seed/001_contract_registry_seed.sql
```

If the Supabase CLI does not support `db execute` in your install, paste `supabase/seed/001_contract_registry_seed.sql` into the Supabase SQL Editor.

Verify app routes:

```powershell
npm run dev
```

Open:

- `/dashboard`
- `/dashboard/contracts`
- `/dashboard/agents`

Commit:

```powershell
git add .
git commit -m "feat: add Web3 Supabase schema wallet auth contract registry and AI agent dashboard"
git push
```
