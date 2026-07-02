-- STLLCWeb3 initial contract registry seed
-- Replace placeholder addresses with verified deployment addresses before production use.

insert into public.contracts (name, contract_type, address, chain_id, network, verified, status, notes)
values
  ('STLLC Equity Token', 'erc20', '0x0000000000000000000000000000000000000001', 80002, 'polygon-amoy', false, 'draft', 'Placeholder for Shylow Thompson LLC equity-style/internal registry token. Do not present as a security offering without counsel.'),
  ('STLLC Deal Note Token', 'deal_note', '0x0000000000000000000000000000000000000002', 80002, 'polygon-amoy', false, 'draft', 'Placeholder for tokenized deal note workflow.'),
  ('SHTX Utility Token', 'erc20', '0x0000000000000000000000000000000000000003', 80002, 'polygon-amoy', false, 'draft', 'Placeholder for app utility/loyalty token.'),
  ('KhakiSol Loyalty NFT', 'erc721', '0x0000000000000000000000000000000000000004', 80002, 'polygon-amoy', false, 'draft', 'Placeholder for KhakiSol loyalty/membership NFT.'),
  ('Deal Track Record SBT', 'soulbound', '0x0000000000000000000000000000000000000005', 80002, 'polygon-amoy', false, 'draft', 'Placeholder soulbound credential for deal history and reputation.')
on conflict (address, chain_id) do update set
  name = excluded.name,
  contract_type = excluded.contract_type,
  network = excluded.network,
  verified = excluded.verified,
  status = excluded.status,
  notes = excluded.notes;

insert into public.tokens (contract_id, symbol, name, decimals, token_standard, utility_description)
select c.id, 'STLLC', 'STLLC Equity Token', 18, 'erc20', 'Internal equity-style token registry placeholder.'
from public.contracts c where c.name = 'STLLC Equity Token'
on conflict do nothing;

insert into public.tokens (contract_id, symbol, name, decimals, token_standard, utility_description)
select c.id, 'SHTX', 'SHTX Utility Token', 18, 'erc20', 'Utility token placeholder for app access, loyalty, and future Web3 workflows.'
from public.contracts c where c.name = 'SHTX Utility Token'
on conflict do nothing;
