-- supabase/migrations/002_stllc_seed_data.sql
-- Seed: known deal + mainnet contract addresses

insert into deals (deal_ref, property_addr, total_tokens, face_value_usdc, repayment_usdc, arv_usd, maturity_date, contract_addr, status)
values (
  'ST-DEAL-008',
  '142 Ridgewood Dr, De Soto, MO 63020',
  1290,
  100.000000,
  106.000000,
  195000.00,
  now() + interval '180 days',
  '0xFc1CfE6839c6B990aebee14067Ca1b36374922E6',  -- polygon mainnet
  'active'
) on conflict (deal_ref) do nothing;
