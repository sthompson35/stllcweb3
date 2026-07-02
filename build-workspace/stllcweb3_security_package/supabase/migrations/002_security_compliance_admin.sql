-- STLLCWeb3 Security + Compliance Hardening
-- Adds Supabase Auth linkage, compliance gates, rate-limit audit table,
-- and admin-only mutation controls for contracts/deals.

alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade,
  add column if not exists kyc_status text not null default 'not_started'
    check (kyc_status in ('not_started','pending','approved','rejected','expired')),
  add column if not exists accreditation_status text not null default 'unknown'
    check (accreditation_status in ('unknown','self_attested','verified','rejected','expired')),
  add column if not exists compliance_notes text;

create table if not exists public.investor_compliance_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  wallet_address text,
  jurisdiction text default 'US-MO',
  kyc_status text not null default 'not_started'
    check (kyc_status in ('not_started','pending','approved','rejected','expired')),
  accreditation_status text not null default 'unknown'
    check (accreditation_status in ('unknown','self_attested','verified','rejected','expired')),
  risk_tier text not null default 'standard'
    check (risk_tier in ('standard','enhanced_review','blocked')),
  can_view_private_deals boolean not null default false,
  can_commit_capital boolean not null default false,
  accepted_terms_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  endpoint text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  last_request_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(bucket_key, endpoint, window_start)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  actor_auth_user_id uuid references auth.users(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.investor_compliance_profiles enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.admin_audit_logs enable row level security;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.users where auth_user_id = auth.uid() limit 1), 'viewer');
$$;

create or replace function public.is_admin_or_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('admin','operator');
$$;

-- Harden mutation rights. Public/app users can read registry data, but mutation is admin/operator only.
drop policy if exists "admin mutate contracts" on public.contracts;
create policy "admin mutate contracts" on public.contracts
  for all using (public.is_admin_or_operator())
  with check (public.is_admin_or_operator());

drop policy if exists "admin mutate tokens" on public.tokens;
create policy "admin mutate tokens" on public.tokens
  for all using (public.is_admin_or_operator())
  with check (public.is_admin_or_operator());

drop policy if exists "admin mutate nfts" on public.nfts;
create policy "admin mutate nfts" on public.nfts
  for all using (public.is_admin_or_operator())
  with check (public.is_admin_or_operator());

drop policy if exists "read deals gated" on public.deals;
create policy "read deals gated" on public.deals
  for select using (
    public.is_admin_or_operator()
    or exists (
      select 1 from public.investor_compliance_profiles icp
      where icp.user_id = public.current_app_user_id()
        and icp.can_view_private_deals = true
        and icp.risk_tier <> 'blocked'
    )
  );

drop policy if exists "admin mutate deals" on public.deals;
create policy "admin mutate deals" on public.deals
  for all using (public.is_admin_or_operator())
  with check (public.is_admin_or_operator());

drop policy if exists "read own compliance" on public.investor_compliance_profiles;
create policy "read own compliance" on public.investor_compliance_profiles
  for select using (user_id = public.current_app_user_id() or public.is_admin_or_operator());

drop policy if exists "admin mutate compliance" on public.investor_compliance_profiles;
create policy "admin mutate compliance" on public.investor_compliance_profiles
  for all using (public.is_admin_or_operator())
  with check (public.is_admin_or_operator());

drop policy if exists "admin read audit logs" on public.admin_audit_logs;
create policy "admin read audit logs" on public.admin_audit_logs
  for select using (public.is_admin_or_operator());

-- Service role owns server-side rate limit writes; no direct client policy exposed for api_rate_limits.
