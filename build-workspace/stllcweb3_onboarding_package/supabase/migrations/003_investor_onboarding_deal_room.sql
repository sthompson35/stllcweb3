-- 003 Investor Onboarding + Private Deal Room
-- Connects onboarding, terms, KYC/accreditation stubs, and gated deal access.

alter table public.investor_compliance_profiles
  add column if not exists onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started','in_progress','submitted','approved','rejected','restricted')),
  add column if not exists investor_type text not null default 'unknown'
    check (investor_type in ('unknown','individual','entity','ira','trust','fund')),
  add column if not exists terms_version text,
  add column if not exists terms_ip_address text,
  add column if not exists terms_user_agent text,
  add column if not exists kyc_provider text,
  add column if not exists kyc_reference_id text,
  add column if not exists accreditation_provider text,
  add column if not exists accreditation_reference_id text,
  add column if not exists private_deal_room_notes text;

create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  compliance_profile_id uuid references public.investor_compliance_profiles(id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.kyc_workflow_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  compliance_profile_id uuid references public.investor_compliance_profiles(id) on delete cascade,
  provider text not null default 'stub',
  provider_reference_id text,
  status text not null default 'created'
    check (status in ('created','pending','approved','rejected','expired','manual_review')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accreditation_workflow_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  compliance_profile_id uuid references public.investor_compliance_profiles(id) on delete cascade,
  provider text not null default 'stub',
  provider_reference_id text,
  status text not null default 'created'
    check (status in ('created','self_attested','pending','verified','rejected','expired','manual_review')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.private_deal_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  access_level text not null default 'viewer'
    check (access_level in ('viewer','qualified','commitment_enabled','blocked')),
  granted_by uuid references public.users(id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  notes text,
  unique(user_id, deal_id)
);

alter table public.terms_acceptances enable row level security;
alter table public.kyc_workflow_requests enable row level security;
alter table public.accreditation_workflow_requests enable row level security;
alter table public.private_deal_access_grants enable row level security;

create or replace function public.can_view_private_deal(target_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.investor_compliance_profiles p
    left join public.private_deal_access_grants g
      on g.user_id = p.user_id
     and g.deal_id = target_deal_id
     and (g.expires_at is null or g.expires_at > now())
    where p.user_id = public.current_app_user_id()
      and p.accepted_terms_at is not null
      and p.can_view_private_deals = true
      and p.risk_tier <> 'blocked'
      and p.kyc_status in ('pending','approved')
      and (g.access_level is null or g.access_level in ('viewer','qualified','commitment_enabled'))
  );
$$;

create or replace function public.can_commit_to_private_deal(target_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.investor_compliance_profiles p
    join public.private_deal_access_grants g
      on g.user_id = p.user_id
     and g.deal_id = target_deal_id
     and (g.expires_at is null or g.expires_at > now())
    where p.user_id = public.current_app_user_id()
      and p.accepted_terms_at is not null
      and p.can_commit_capital = true
      and p.risk_tier <> 'blocked'
      and p.kyc_status = 'approved'
      and p.accreditation_status = 'verified'
      and g.access_level = 'commitment_enabled'
  );
$$;

create policy "Users can read own terms acceptances"
  on public.terms_acceptances for select
  using (user_id = public.current_app_user_id() or public.is_admin_or_operator());

create policy "Users can read own KYC requests"
  on public.kyc_workflow_requests for select
  using (user_id = public.current_app_user_id() or public.is_admin_or_operator());

create policy "Users can read own accreditation requests"
  on public.accreditation_workflow_requests for select
  using (user_id = public.current_app_user_id() or public.is_admin_or_operator());

create policy "Users can read own private deal grants"
  on public.private_deal_access_grants for select
  using (user_id = public.current_app_user_id() or public.is_admin_or_operator());
