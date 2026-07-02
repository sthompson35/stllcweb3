-- Phase 7: Private Capital Infrastructure
-- Applies on top of existing STLLCWeb3 schema: users, wallets, contracts, tokens, nfts, deals, agent_logs, investor_compliance_profiles.

create extension if not exists "pgcrypto";

create table if not exists deal_documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  title text not null,
  document_type text not null check (document_type in (
    'PPM','OPERATING_AGREEMENT','SUBSCRIPTION_AGREEMENT','INVESTOR_UPDATE','FINANCIAL_STATEMENT',
    'DUE_DILIGENCE','PROPERTY_PHOTO','APPRAISAL','ENVIRONMENTAL_REPORT','TITLE_COMMITMENT','CLOSING_DOCUMENT','OTHER'
  )),
  storage_bucket text not null default 'deal-documents',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  visibility text not null default 'approved_investors' check (visibility in ('admin_only','approved_investors','deal_investors','public_preview')),
  version integer not null default 1,
  is_active boolean not null default true,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references deal_documents(id) on delete cascade,
  version integer not null,
  storage_path text not null,
  change_note text,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique(document_id, version)
);

create table if not exists document_access_logs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references deal_documents(id) on delete cascade,
  user_id uuid references users(id),
  deal_id uuid references deals(id),
  action text not null check (action in ('view','download','signed_url_created','denied')),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  investor_user_id uuid not null references users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','pending_review','awaiting_signature','approved','funded','rejected','cancelled')),
  requested_amount numeric(14,2) not null default 0,
  approved_amount numeric(14,2),
  subscription_agreement_document_id uuid references deal_documents(id),
  submitted_at timestamptz,
  approved_at timestamptz,
  funded_at timestamptz,
  rejected_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(deal_id, investor_user_id)
);

create table if not exists subscription_signatures (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  signature_request_id uuid,
  signer_user_id uuid references users(id),
  status text not null default 'pending' check (status in ('pending','sent','viewed','signed','declined','expired','voided')),
  signed_at timestamptz,
  signature_provider text not null default 'internal_stub',
  provider_envelope_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscription_status_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references users(id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists signature_requests (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'internal_stub' check (provider in ('internal_stub','docusign','dropbox_sign','pandadoc')),
  deal_id uuid references deals(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete cascade,
  document_id uuid references deal_documents(id),
  signer_user_id uuid references users(id),
  status text not null default 'created' check (status in ('created','sent','viewed','signed','declined','expired','failed','voided')),
  provider_envelope_id text,
  signing_url text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists signature_events (
  id uuid primary key default gen_random_uuid(),
  signature_request_id uuid references signature_requests(id) on delete cascade,
  provider text not null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists capital_commitments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  investor_user_id uuid not null references users(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  committed_amount numeric(14,2) not null default 0,
  funded_amount numeric(14,2) not null default 0,
  remaining_amount numeric(14,2) generated always as (committed_amount - funded_amount) stored,
  status text not null default 'pending' check (status in ('pending','committed','partially_funded','funded','cancelled','defaulted')),
  ownership_percent numeric(9,6),
  preferred_return_percent numeric(7,4),
  profit_share_percent numeric(7,4),
  funding_instructions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(deal_id, investor_user_id)
);

create table if not exists capital_calls (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  title text not null,
  call_amount numeric(14,2) not null,
  due_date date,
  status text not null default 'draft' check (status in ('draft','issued','partially_funded','funded','cancelled')),
  issued_by uuid references users(id),
  issued_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists investor_positions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  investor_user_id uuid not null references users(id) on delete cascade,
  capital_commitment_id uuid references capital_commitments(id) on delete set null,
  ownership_units numeric(18,6) not null default 0,
  ownership_percent numeric(9,6) not null default 0,
  basis_amount numeric(14,2) not null default 0,
  preferred_return_accrued numeric(14,2) not null default 0,
  distributions_paid numeric(14,2) not null default 0,
  token_contract_address text,
  token_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(deal_id, investor_user_id)
);

create table if not exists investor_activity_logs (
  id uuid primary key default gen_random_uuid(),
  investor_user_id uuid references users(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  activity_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_deal_documents_deal_id on deal_documents(deal_id);
create index if not exists idx_document_access_logs_document_id on document_access_logs(document_id);
create index if not exists idx_subscriptions_deal_investor on subscriptions(deal_id, investor_user_id);
create index if not exists idx_capital_commitments_deal_id on capital_commitments(deal_id);
create index if not exists idx_investor_positions_deal_id on investor_positions(deal_id);

alter table deal_documents enable row level security;
alter table document_versions enable row level security;
alter table document_access_logs enable row level security;
alter table subscriptions enable row level security;
alter table subscription_signatures enable row level security;
alter table signature_requests enable row level security;
alter table signature_events enable row level security;
alter table capital_commitments enable row level security;
alter table capital_calls enable row level security;
alter table investor_positions enable row level security;
alter table investor_activity_logs enable row level security;

-- Production note: keep mutations behind service-role API routes. RLS defaults deny direct browser writes until policies are intentionally opened.
