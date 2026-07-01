import { useAccount } from 'wagmi'
import { ADDRESSES, DEAL_NOTES_META, PRODUCTS_META, BADGES_META } from '../contracts'

const CONTRACTS = [
  { name: 'STLLC Equity Token',    standard: 'ERC-20',   addr: ADDRESSES.equity,      desc: 'Tokenized equity in Shylow Thompson LLC real estate operations.' },
  { name: 'ST-DEAL-008 Note',      standard: 'ERC-20',   addr: ADDRESSES.dealNote008, desc: '1,290 tokens · $100 face · $106 repayment · 6-month term.' },
  { name: 'SHTX Utility Token',    standard: 'ERC-20',   addr: ADDRESSES.shtx,        desc: 'Loyalty token: 10 SHTX per $1 KhakiSol purchase. 10M max supply.' },
  { name: 'ST Deal Track Record',  standard: 'ERC-721',  addr: ADDRESSES.trackRecord,  desc: 'Soulbound NFT minted per closed deal. On-chain performance record.' },
  { name: 'KhakiSol Loyalty',      standard: 'ERC-1155', addr: ADDRESSES.khakiSol,    desc: 'Multi-token loyalty: badges (IDs 1–5) + product NFTs (ID 6+).' },
  { name: 'ST Spread Collection',  standard: 'ERC-1155', addr: ADDRESSES.spreadCollection || '(deploy pending)', desc: '15-token collection: deal notes, product NFTs, spread badges.' },
]

function shorten(addr: string) {
  if (!addr || addr.startsWith('(')) return addr
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

export default function Dashboard({ setPage }: { setPage: (p: any) => void }) {
  const { isConnected } = useAccount()

  const totalDealCapacity =
    DEAL_NOTES_META.reduce((s, d) => s + d.face * d.maxSupply, 0)
  const avgYield = (
    DEAL_NOTES_META.reduce((s, d) => s + d.yieldPct, 0) / DEAL_NOTES_META.length
  ).toFixed(1)

  return (
    <>
      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-eyebrow">Shylow Thompson LLC · Missouri Private Lending</div>
        <h1 className="hero-title">
          Real Estate Yield,<br />
          <em>On-Chain.</em>
        </h1>
        <p className="hero-body">
          Tokenized deal notes, loyalty rewards, and product NFTs—all backed
          by first-lien deeds of trust on Missouri investment properties.
          Reg D 506(c) · Accredited investors only.
        </p>
        <div className="hero-stats">
          <div>
            <div className="hero-stat-value">
              ${(totalDealCapacity / 1_000_000).toFixed(1)}M
            </div>
            <div className="hero-stat-label">DEAL NOTE CAPACITY</div>
          </div>
          <div>
            <div className="hero-stat-value">{avgYield}%</div>
            <div className="hero-stat-label">AVG YIELD (NEW DEALS)</div>
          </div>
          <div>
            <div className="hero-stat-value">15</div>
            <div className="hero-stat-label">SPREAD NFT TYPES</div>
          </div>
          <div>
            <div className="hero-stat-value">6</div>
            <div className="hero-stat-label">LIVE CONTRACTS</div>
          </div>
        </div>
      </div>

      {/* ── Reg D notice ── */}
      <div className="reg-banner">
        ⚠️ Securities offered under Regulation D Rule 506(c). This portal is restricted to verified
        accredited investors. Interests have not been registered under the Securities Act of 1933.
        Past performance does not guarantee future results.
      </div>

      {/* ── Quick actions ── */}
      {!isConnected && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="card-name">Connect your wallet to view your holdings</div>
            <div className="card-ref" style={{ marginTop: 4 }}>MetaMask or Coinbase Wallet · Polygon Mainnet</div>
          </div>
          <button className="btn btn-primary" onClick={() => setPage('portfolio')}>
            View Portfolio →
          </button>
        </div>
      )}

      {/* ── Spread Collection CTA ── */}
      <div className="section-header">
        <div>
          <div className="section-title">ST Spread Collection</div>
          <div className="section-sub">15 tokenized positions across three yield strategies</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setPage('spread')}>
          Browse all 15 →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {/* Deal Notes */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon card-icon-deal">🏠</div>
            <span className="tier-label tier-deal">Tier 1</span>
          </div>
          <div className="card-name">Deal Note NFTs</div>
          <div className="card-ref">Token IDs 1 – 5</div>
          <div className="card-meta" style={{ marginBottom: 0 }}>
            <div className="meta-item">
              <div className="meta-label">Deals</div>
              <div className="meta-value">5</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Yield Range</div>
              <div className="meta-value teal">6 – 8%</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Face Value</div>
              <div className="meta-value">$100 – $500</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Payout</div>
              <div className="meta-value">USDC</div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon card-icon-product">👟</div>
            <span className="tier-label tier-product">Tier 2</span>
          </div>
          <div className="card-name">KhakiSol Product NFTs</div>
          <div className="card-ref">Token IDs 6 – 10</div>
          <div className="card-meta" style={{ marginBottom: 0 }}>
            <div className="meta-item">
              <div className="meta-label">Products</div>
              <div className="meta-value">5</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Royalty</div>
              <div className="meta-value amber">5%</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Price Range</div>
              <div className="meta-value">$189 – $800</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Max Units</div>
              <div className="meta-value">{PRODUCTS_META.reduce((s, p) => s + p.maxSupply, 0)}</div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon card-icon-badge">💎</div>
            <span className="tier-label tier-badge">Tier 3</span>
          </div>
          <div className="card-name">Spread Badges</div>
          <div className="card-ref">Token IDs 11 – 15</div>
          <div className="card-meta" style={{ marginBottom: 0 }}>
            <div className="meta-item">
              <div className="meta-label">Tiers</div>
              <div className="meta-value">5</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Max SHTX/Day</div>
              <div className="meta-value purple">500</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Total Supply</div>
              <div className="meta-value">{BADGES_META.reduce((s, b) => s + b.maxSupply, 0)}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Transfer Lock</div>
              <div className="meta-value">7 – 90 days</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── All contracts ── */}
      <div className="section-header">
        <div>
          <div className="section-title">Deployed Contracts</div>
          <div className="section-sub">All contracts live on Polygon Mainnet (chainId 137)</div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--ghost)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 40 }}>
        {CONTRACTS.map((c, i) => (
          <div
            key={c.addr}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              alignItems: 'center',
              gap: 16,
              padding: '16px 24px',
              borderBottom: i < CONTRACTS.length - 1 ? '1px solid var(--ghost)' : 'none',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--steel)' }}>{c.desc}</div>
            </div>
            <span className="tag tag-teal">{c.standard}</span>
            <span
              className="addr"
              title={c.addr}
              onClick={() => copy(c.addr)}
            >
              {shorten(c.addr)}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
