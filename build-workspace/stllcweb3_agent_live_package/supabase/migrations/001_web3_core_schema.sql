-- STLLCWeb3 Core Schema
-- users, wallets, contracts, tokens, NFTs, deals, agent_logs

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  role text not null default 'viewer' check (role in ('admin','operator','investor','viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  wallet_address text not null unique,
  wallet_type text not null check (wallet_type in ('sequence','metamask','walletconnect','unknown')),
  chain_id integer,
  is_primary boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contract_type text not null check (contract_type in ('erc20','erc721','erc1155','deal_note','soulbound','registry','other')),
  address text not null,
  chain_id integer not null,
  network text not null,
  abi jsonb,
  deployment_tx text,
  verified boolean not null default false,
  status text not null default 'draft' check (status in ('draft','deployed','verified','deprecated')),
  notes text,
  created_at timestamptz not null default now(),
  unique(address, chain_id)
);

create table if not exists public.tokens (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade,
  symbol text not null,
  name text not null,
  decimals integer default 18,
  token_standard text not null check (token_standard in ('erc20','erc721','erc1155','sbt')),
  supply_numeric numeric,
  utility_description text,
  created_at timestamptz not null default now()
);

create table if not exists public.nfts (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade,
  token_id text not null,
  owner_wallet text,
  name text,
  metadata_uri text,
  metadata jsonb,
  nft_category text check (nft_category in ('loyalty','deal_record','membership','collectible','real_estate','other')),
  created_at timestamptz not null default now(),
  unique(contract_id, token_id)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  property_address text,
  city text,
  state text default 'MO',
  strategy text check (strategy in ('wholesale','flip','brrrr','rental','land','development','tokenized_note','other')),
  status text not null default 'intake' check (status in ('intake','underwriting','approved','funding','active','exited','killed')),
  arv numeric,
  purchase_price numeric,
  rehab_budget numeric,
  target_raise numeric,
  linked_contract_id uuid references public.contracts(id),
  risk_score numeric,
  ai_summary text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  agent_name text not null,
  user_id uuid references public.users(id),
  wallet_address text,
  deal_id uuid references public.deals(id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  confidence numeric,
  risk_flags text[],
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.contracts enable row level security;
alter table public.tokens enable row level security;
alter table public.nfts enable row level security;
alter table public.deals enable row level security;
alter table public.agent_logs enable row level security;

-- MVP policies: authenticated users can read core registry data. Admin/operator permissions should be hardened before capital/investor launch.
create policy "read registry contracts" on public.contracts for select using (true);
create policy "read tokens" on public.tokens for select using (true);
create policy "read nfts" on public.nfts for select using (true);
create policy "read own wallets" on public.wallets for select using (auth.uid()::text = user_id::text);
create policy "insert own wallets" on public.wallets for insert with check (auth.uid()::text = user_id::text);
create policy "read own agent logs" on public.agent_logs for select using (auth.uid()::text = user_id::text);
create policy "insert own agent logs" on public.agent_logs for insert with check (auth.uid()::text = user_id::text);
