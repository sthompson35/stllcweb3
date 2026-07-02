# ARCHITECT Implementation Order — Security, Compliance, Admin Controls

## Mission
Harden `stllcweb3` before any public or investor-facing deployment.

This layer adds:
- Supabase Auth bearer-token verification for protected API routes.
- Request rate limiting backed by Supabase.
- Investor compliance gates for gated deal-room and capital actions.
- Admin/operator-only mutation controls for `contracts` and `deals`.
- Admin audit logs for every mutation.
- Security dashboard components for compliance and mutation smoke tests.

## Apply Order

1. Copy this package into the repo root.
2. Run:

```powershell
.\scripts\apply_security_package.ps1 -RepoPath C:\stllcweb3
```

3. Run Supabase migrations in order:

```bash
supabase db push
```

or manually run:

```sql
supabase/migrations/001_web3_core_schema.sql
supabase/migrations/002_security_compliance_admin.sql
```

4. Confirm env vars:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY=
```

5. Create the first admin app user by linking `public.users.auth_user_id` to the Supabase Auth user id and setting `role = 'admin'`.

6. Test protected AI route:

```bash
POST /api/agents/crypto
Authorization: Bearer <supabase_access_token>
```

7. Test admin-only mutation routes:

```bash
POST /api/admin/contracts
POST /api/admin/deals
```

## Security Rule
Do not expose private tokenized real estate opportunities until the investor has:
- accepted terms,
- active compliance profile,
- risk tier not blocked,
- private deal access enabled,
- and, for capital commitments, approved KYC plus accreditation status.

## Known Build Assumption
This package assumes Next.js App Router and existing Supabase client conventions from the prior `stllcweb3_agent_live_package`.
