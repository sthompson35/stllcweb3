-- supabase/migrations/001_stllc_core_schema.sql
-- stllcweb3 core tables: investors, deals, tokens, transactions, events
-- Apply: supabase db push  OR  psql $DATABASE_URL -f this_file.sql

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Investors ────────────────────────────────────────────────────────────────
create table if not exists investors (
  id              uuid primary key default uuid_generate_v4(),
  wallet_address  text unique not null,
  email           text,
  name            text,
  kyc_status      text not null default 'pending'
                    check (kyc_status in ('pending','approved','rejected')),
  whitelisted     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_investors_wallet on investors(wallet_address);

-- ── Deals ────────────────────────────────────────────────────────────────────
create table if not exists deals (
  id              uuid primary key default uuid_generate_v4(),
  deal_ref        text unique not null,            -- e.g. ST-DEAL-008
  property_addr   text not null,
  total_tokens    integer not null,
  face_value_usdc numeric(18,6) not null,
  repayment_usdc  numeric(18,6) not null,
  arv_usd         numeric(18,2),
  maturity_date   timestamptz not null,
  contract_addr   text,                            -- deployed ERC-20 address
  status          text not null default 'active'
                    check (status in ('active','funded','matured','closed')),
  created_at      timestamptz not null default now()
);

-- ── Token Holdings ───────────────────────────────────────────────────────────
create table if not exists token_holdings (
  id              uuid primary key default uuid_generate_v4(),
  investor_id     uuid not null references investors(id) on delete cascade,
  deal_id         uuid not null references deals(id) on delete cascade,
  token_type      text not null                    -- equity|deal_note|shtx|track|loyalty
                    check (token_type in ('equity','deal_note','shtx','track','loyalty')),
  amount          numeric(36,18) not null,
  contract_addr   text not null,
  chain_id        integer not null default 137,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (investor_id, deal_id, token_type)
);

-- ── On-chain Events (mirror of webhook events) ────────────────────────────────
create table if not exists chain_events (
  id              uuid primary key default uuid_generate_v4(),
  tx_hash         text unique not null,
  block_number    bigint not null,
  chain_id        integer not null,
  contract_addr   text not null,
  event_name      text not null,
  args            jsonb not null default '{}',
  processed       boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_events_contract on chain_events(contract_addr);
create index if not exists idx_events_processed on chain_events(processed) where not processed;

-- ── Webhook Log ──────────────────────────────────────────────────────────────
create table if not exists webhook_log (
  id              uuid primary key default uuid_generate_v4(),
  alchemy_id      text unique,
  webhook_type    text not null,
  payload         jsonb not null,
  signature_valid boolean not null,
  processed       boolean not null default false,
  error           text,
  created_at      timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table investors      enable row level security;
alter table deals          enable row level security;
alter table token_holdings enable row level security;
alter table chain_events   enable row level security;
alter table webhook_log    enable row level security;

-- Service role has full access
create policy "service_role_all" on investors      for all using (auth.role() = 'service_role');
create policy "service_role_all" on deals          for all using (auth.role() = 'service_role');
create policy "service_role_all" on token_holdings for all using (auth.role() = 'service_role');
create policy "service_role_all" on chain_events   for all using (auth.role() = 'service_role');
create policy "service_role_all" on webhook_log    for all using (auth.role() = 'service_role');

-- Investors can read their own record
create policy "investor_read_own" on investors
  for select using (wallet_address = current_setting('app.wallet', true));

create policy "investor_read_holdings" on token_holdings
  for select using (
    investor_id = (
      select id from investors
      where wallet_address = current_setting('app.wallet', true)
    )
  );

-- Deals are public-readable
create policy "deals_public_read" on deals for select using (true);
