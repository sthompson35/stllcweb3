# ARCHITECT Implementation Order — Investor Onboarding + Private Deal Room

## Mission
Add the investor-facing compliance intake layer before public/private deal access.

This package adds:
- Investor onboarding screens.
- Terms acceptance flow.
- KYC workflow stub.
- Accreditation workflow stub.
- Private deal-room access gates connected to `investor_compliance_profiles`.
- API routes for compliance profile creation/update.
- Deal-room components that block access until compliance requirements are met.

## Apply Order

1. Unzip this package.
2. From the package folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply_onboarding_package.ps1 -RepoPath C:\stllcweb3
```

3. Run Supabase migration:

```bash
supabase db push
```

or manually run:

```sql
supabase/migrations/003_investor_onboarding_deal_room.sql
```

4. Confirm env vars exist:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

5. Start local app:

```bash
npm run dev
```

6. Test routes:

```text
/onboarding
/deal-room
/deal-room/<deal-id>
```

## Access Logic

Private deal room access requires:
- Supabase authenticated user.
- `investor_compliance_profiles.accepted_terms_at` is not null.
- `kyc_status` is `approved` or `pending` for preview-only access.
- `accreditation_status` is `verified` or `self_attested` depending on deal requirement.
- `can_view_private_deals = true`.
- `risk_tier != blocked`.

Capital commitment access requires stricter controls:
- `kyc_status = approved`.
- `accreditation_status = verified`.
- `can_commit_capital = true`.

## Legal Reality Check

This is a workflow stub, not legal compliance by itself. Real-money tokenized real estate offerings need securities counsel, proper offering docs, KYC/AML vendor integration, accredited investor verification where applicable, disclosures, custody controls, and jurisdiction review.
