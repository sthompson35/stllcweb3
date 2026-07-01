// Deployed contract addresses on Polygon mainnet
export const ADDRESSES = {
  equity:          '0x14C77D3b14fa662119A78102FC5de31114C6450f',
  dealNote008:     '0xeF3177D3C908432f8a5BbEA012245Ee5B439Cbd4',
  shtx:            '0xb015236Ffc5Cc3E7a2249526e2664171B36Bd844',
  trackRecord:     '0x0fBBFB730d981Af5a01Df2F080f8a576A45ef90d',
  khakiSol:        '0xB2FDE2B62BB20286Da67eb99CF0068263de4Fb21',
  spreadCollection: '0x364621d5b4f77feF957708F0A35cB674A8bf19a9',
} as const

// ── Minimal ABIs ─────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  { name: 'name',        type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf',   type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export const DEAL_NOTE_ABI = [
  ...ERC20_ABI,
  { name: 'faceValuePerToken',  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'repaymentPerToken',  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maturityDate',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'dealReference',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'propertyAddress',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'matured',            type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'impliedAnnualYieldBps', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'whitelist',          type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
] as const

export const SPREAD_COLLECTION_ABI = [
  // ERC-1155
  { name: 'balanceOf',   type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  // Deal notes
  {
    name: 'dealNotes', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'dealRef',                 type: 'string' },
      { name: 'propertyAddress',         type: 'string' },
      { name: 'faceValueUSDC',           type: 'uint256' },
      { name: 'repaymentUSDC',           type: 'uint256' },
      { name: 'maturityDate',            type: 'uint256' },
      { name: 'maxSupply',               type: 'uint256' },
      { name: 'arvUSD',                  type: 'uint256' },
      { name: 'matured',                 type: 'bool' },
      { name: 'fundsDeposited',          type: 'bool' },
      { name: 'totalRepaymentDeposited', type: 'uint256' },
    ],
  },
  { name: 'dealNoteYieldBps',          type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'dealNoteRepaymentRequired', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  // Product NFTs
  {
    name: 'productNFTs', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'name',          type: 'string' },
      { name: 'sku',           type: 'string' },
      { name: 'maxSupply',     type: 'uint256' },
      { name: 'priceUSDCents', type: 'uint256' },
      { name: 'active',        type: 'bool' },
    ],
  },
  // Badge tiers
  {
    name: 'badgeTiers', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'name',             type: 'string' },
      { name: 'shtxPerDay',       type: 'uint256' },
      { name: 'transferCooldown', type: 'uint256' },
      { name: 'maxSupply',        type: 'uint256' },
    ],
  },
  { name: 'dealWhitelist', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'paused',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'hasRole',      type: 'function', stateMutability: 'view', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'MANAGER_ROLE',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  { name: 'COMPLIANCE_ROLE', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  { name: 'MINTER_ROLE',     type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  // Admin writes
  { name: 'issueDealNote',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'investor', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'mintProductNFT',  type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'buyer', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [] },
  { name: 'mintBadge',       type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'recipient', type: 'address' }, { name: 'tokenId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'depositRepayment',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'usdcAmount', type: 'uint256' }], outputs: [] },
  { name: 'setDealWhitelist',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'account', type: 'address' }, { name: 'status', type: 'bool' }], outputs: [] },
  { name: 'batchSetDealWhitelist', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'accounts', type: 'address[]' }, { name: 'status', type: 'bool' }], outputs: [] },
  { name: 'pause',   type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'unpause', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  // Investor writes
  { name: 'redeemDealNote', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], outputs: [] },
] as const

export const DEAL_NOTE_WRITE_ABI = [
  { name: 'issueTokens',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'investor', type: 'address' }, { name: 'tokenAmount', type: 'uint256' }], outputs: [] },
  { name: 'depositRepayment', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'setWhitelist',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'account', type: 'address' }, { name: 'status', type: 'bool' }], outputs: [] },
  { name: 'pause',   type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'unpause', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  // Investor
  { name: 'redeem', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'tokenAmount', type: 'uint256' }], outputs: [] },
  // Read
  { name: 'matured',   type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'repaymentPerToken', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'faceValuePerToken', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'hasRole', type: 'function', stateMutability: 'view', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'MANAGER_ROLE', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

export const USDC_ABI = [
  { name: 'approve',  type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const

export const ERC1155_ABI = [
  { name: 'balanceOf',   type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
] as const

// ── Static metadata (mirrors contract initialisation; updated after deploy) ──

export const DEAL_NOTES_META = [
  { id: 1, dealRef: 'ST-DEAL-009', property: 'TBD — Placeholder Property A, MO', face: 100,  repayment: 106, yieldPct: 6,  termMonths: 6,  maxSupply: 500,  arv: 195_000 },
  { id: 2, dealRef: 'ST-DEAL-010', property: 'TBD — Placeholder Property B, MO', face: 100,  repayment: 107, yieldPct: 7,  termMonths: 9,  maxSupply: 750,  arv: 220_000 },
  { id: 3, dealRef: 'ST-DEAL-011', property: 'TBD — Placeholder Property C, MO', face: 100,  repayment: 108, yieldPct: 8,  termMonths: 12, maxSupply: 1000, arv: 250_000 },
  { id: 4, dealRef: 'ST-DEAL-012', property: 'TBD — Placeholder Property D, MO', face: 250,  repayment: 265, yieldPct: 6,  termMonths: 6,  maxSupply: 300,  arv: 350_000 },
  { id: 5, dealRef: 'ST-DEAL-013', property: 'TBD — Placeholder Property E, MO', face: 500,  repayment: 530, yieldPct: 6,  termMonths: 6,  maxSupply: 200,  arv: 550_000 },
]

export const PRODUCTS_META = [
  { id: 6,  name: 'Desert Tan Combat Boot',   sku: 'KS-BOOT-001', maxSupply: 250, priceUSD: 189.99 },
  { id: 7,  name: 'Multicam Field Jacket',    sku: 'KS-JACK-001', maxSupply: 100, priceUSD: 299.99 },
  { id: 8,  name: 'Operator Pack Gen2',       sku: 'KS-PACK-002', maxSupply: 150, priceUSD: 249.99 },
  { id: 9,  name: 'Brokerage Tactical Vest',  sku: 'KS-VEST-001', maxSupply: 50,  priceUSD: 449.99 },
  { id: 10, name: "KhakiSol Founder's Watch", sku: 'KS-WTCH-001', maxSupply: 25,  priceUSD: 799.99 },
]

export const BADGES_META = [
  { id: 11, name: 'Spread Bronze',   shtxPerDay: 5,   cooldownDays: 7,  maxSupply: 500, color: '#cd7f32' },
  { id: 12, name: 'Spread Silver',   shtxPerDay: 15,  cooldownDays: 14, maxSupply: 250, color: '#a8a9ad' },
  { id: 13, name: 'Spread Gold',     shtxPerDay: 50,  cooldownDays: 30, maxSupply: 100, color: '#d4af37' },
  { id: 14, name: 'Spread Platinum', shtxPerDay: 150, cooldownDays: 60, maxSupply: 50,  color: '#e5e4e2' },
  { id: 15, name: 'Spread Diamond',  shtxPerDay: 500, cooldownDays: 90, maxSupply: 10,  color: '#b9f2ff' },
]
