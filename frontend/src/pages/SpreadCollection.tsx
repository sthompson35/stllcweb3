import { useReadContracts } from 'wagmi'
import { ADDRESSES, SPREAD_COLLECTION_ABI, DEAL_NOTES_META, PRODUCTS_META, BADGES_META } from '../contracts'

type Filter = 'all' | 'deal' | 'product' | 'badge'
import { useState } from 'react'

const BADGE_EMOJIS = ['🥉', '🥈', '🥇', '🏆', '💎']
const ADDR = ADDRESSES.spreadCollection as `0x${string}`

// ── On-chain data types ───────────────────────────────────────────────────────

// viem multicall returns struct outputs as positional arrays, not named objects
type DealNoteArr = [string, string, bigint, bigint, bigint, bigint, bigint, boolean, boolean, bigint]
//                  dealRef propAddr face    repay   matur   maxSup  arv    matured funds   deposited
type ProductArr  = [string, string, bigint, bigint, boolean]
//                  name    sku     maxSup  price   active
type BadgeArr    = [string, bigint, bigint, bigint]
//                  name    shtx/d  cooldown maxSup

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDaysLeft(maturity: bigint) {
  const secs = Number(maturity) - Math.floor(Date.now() / 1000)
  if (secs <= 0) return 'Matured'
  const days = Math.ceil(secs / 86400)
  if (days > 365) return `${(days / 365).toFixed(1)} yr`
  return `${days}d`
}

function pct(supply: bigint | undefined, max: bigint | number) {
  if (!supply || supply === 0n) return 0
  const m = typeof max === 'number' ? BigInt(max) : max
  if (m === 0n) return 0
  return Math.min(100, Number((supply * 100n) / m))
}

// ── Card components ───────────────────────────────────────────────────────────

function DealNoteCard({
  meta, supply, onChain, yieldBps,
}: {
  meta: typeof DEAL_NOTES_META[0]
  supply?: bigint
  onChain?: DealNoteArr
  yieldBps?: bigint
}) {
  const face      = onChain ? Number(onChain[2]) / 1e6 : meta.face
  const repayment = onChain ? Number(onChain[3]) / 1e6 : meta.repayment
  const maxSup    = onChain ? Number(onChain[5])       : meta.maxSupply
  const arv       = onChain ? Number(onChain[6])       : meta.arv
  const dealRef   = onChain?.[0] || meta.dealRef
  const prop      = onChain?.[1] || meta.property
  const yieldPct  = yieldBps ? (Number(yieldBps) / 100).toFixed(1) : `${meta.yieldPct}`
  const matured   = onChain?.[7] ?? false
  const daysLeft  = onChain ? fmtDaysLeft(onChain[4]) : `${meta.termMonths} mo`
  const minted    = supply ? Number(supply) : 0
  const progress  = pct(supply, maxSup)
  const totalCap  = (face * maxSup).toLocaleString()

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon card-icon-deal" style={{ fontSize: 22 }}>🏠</div>
        <span className="tier-label tier-deal">Deal Note · ID {meta.id}</span>
      </div>
      <div className="card-name">{dealRef}</div>
      <div className="card-ref">{prop}</div>

      <div className="card-meta">
        <div className="meta-item">
          <div className="meta-label">Face Value</div>
          <div className="meta-value">${face.toLocaleString()} USDC</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Repayment</div>
          <div className="meta-value teal">${repayment.toLocaleString()} USDC</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Yield</div>
          <div className="meta-value teal">{yieldPct}%</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">{matured ? 'Status' : 'Maturity'}</div>
          <div className="meta-value" style={{ color: matured ? 'var(--amber)' : undefined }}>
            {matured ? 'Matured ✓' : daysLeft}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--steel)', fontFamily: 'var(--mono)' }}>
          {maxSup.toLocaleString()} tokens · ${totalCap} capacity
        </span>
        <span style={{ fontSize: 12, color: 'var(--steel)', fontFamily: 'var(--mono)' }}>
          ARV ${arv.toLocaleString()}
        </span>
      </div>

      <div className="progress-wrap">
        <div className="progress-label">
          <span>Offered</span>
          <span>{minted.toLocaleString()} / {maxSup.toLocaleString()}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill teal" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="tag tag-muted">Reg D 506(c)</span>
        <span className="tag tag-muted">USDC payout</span>
        <span className="tag tag-muted">First-lien collateral</span>
        {matured && <span className="tag" style={{ background: 'var(--amber)22', color: 'var(--amber)' }}>Redeem now</span>}
      </div>
    </div>
  )
}

function ProductCard({
  meta, supply, onChain,
}: {
  meta: typeof PRODUCTS_META[0]
  supply?: bigint
  onChain?: ProductArr
}) {
  const name      = onChain?.[0] || meta.name
  const sku       = onChain?.[1] || meta.sku
  const maxSup    = onChain ? Number(onChain[2]) : meta.maxSupply
  const priceUSD  = onChain ? Number(onChain[3]) / 100 : meta.priceUSD
  const active    = onChain?.[4] ?? true
  const minted    = supply ? Number(supply) : 0
  const progress  = pct(supply, maxSup)

  return (
    <div className="card" style={{ opacity: active ? 1 : 0.6 }}>
      <div className="card-header">
        <div className="card-icon card-icon-product" style={{ fontSize: 22 }}>👟</div>
        <span className="tier-label tier-product">Product NFT · ID {meta.id}</span>
      </div>
      <div className="card-name">{name}</div>
      <div className="card-ref">SKU: {sku}</div>

      <div className="card-meta">
        <div className="meta-item">
          <div className="meta-label">Price</div>
          <div className="meta-value amber">${priceUSD.toFixed(2)}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Max Supply</div>
          <div className="meta-value">{maxSup}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Royalty</div>
          <div className="meta-value amber">5% ERC-2981</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Status</div>
          <div className="meta-value" style={{ color: active ? 'var(--teal)' : 'var(--steel)' }}>
            {active ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      <div className="progress-wrap">
        <div className="progress-label">
          <span>Minted</span>
          <span>{minted.toLocaleString()} / {maxSup}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill amber" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="tag tag-muted">Physical redemption</span>
        <span className="tag tag-muted">Secondary royalty</span>
      </div>
    </div>
  )
}

function BadgeCard({
  meta, idx, supply, onChain,
}: {
  meta: typeof BADGES_META[0]
  idx: number
  supply?: bigint
  onChain?: BadgeArr
}) {
  const name        = onChain?.[0]        || meta.name
  const shtxPerDay  = onChain ? Number(onChain[1]) : meta.shtxPerDay
  const cooldown    = onChain ? Number(onChain[2]) / 86400 : meta.cooldownDays
  const maxSup      = onChain ? Number(onChain[3]) : meta.maxSupply
  const annualSHTX  = (shtxPerDay * 365).toLocaleString()
  const minted      = supply ? Number(supply) : 0
  const progress    = pct(supply, maxSup)

  return (
    <div className="badge-card">
      <div className="badge-gem" style={{ background: meta.color + '22', border: `2px solid ${meta.color}44` }}>
        {BADGE_EMOJIS[idx]}
      </div>
      <div className="badge-name">{name}</div>
      <div className="tier-label tier-badge" style={{ marginBottom: 12, display: 'inline-block' }}>
        ID {meta.id}
      </div>
      <div className="badge-shtx">{shtxPerDay}</div>
      <div className="badge-shtx-label">SHTX / DAY</div>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--steel)', marginTop: 4 }}>
        {annualSHTX} SHTX / yr
      </div>

      <div className="badge-stats">
        <div className="badge-stat">
          <div className="badge-stat-val">{minted}</div>
          <div className="badge-stat-lbl">MINTED</div>
        </div>
        <div className="badge-stat">
          <div className="badge-stat-val">{maxSup}</div>
          <div className="badge-stat-lbl">MAX</div>
        </div>
        <div className="badge-stat">
          <div className="badge-stat-val">{Math.round(cooldown)}d</div>
          <div className="badge-stat-lbl">LOCK</div>
        </div>
      </div>

      <div className="progress-wrap" style={{ marginTop: 12 }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: meta.color }} />
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SpreadCollection() {
  const [filter, setFilter] = useState<Filter>('all')

  // ── Batch all on-chain reads ──────────────────────────────────────────────
  // Slots 0–14:  totalSupply(id) for IDs 1–15
  // Slots 15–19: dealNotes(id)   for IDs 1–5
  // Slots 20–24: dealNoteYieldBps(id) for IDs 1–5
  // Slots 25–29: productNFTs(id) for IDs 6–10
  // Slots 30–34: badgeTiers(id)  for IDs 11–15

  const calls = [
    ...Array.from({ length: 15 }, (_, i) => ({
      address: ADDR, abi: SPREAD_COLLECTION_ABI,
      functionName: 'totalSupply' as const, args: [BigInt(i + 1)] as const,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      address: ADDR, abi: SPREAD_COLLECTION_ABI,
      functionName: 'dealNotes' as const, args: [BigInt(i + 1)] as const,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      address: ADDR, abi: SPREAD_COLLECTION_ABI,
      functionName: 'dealNoteYieldBps' as const, args: [BigInt(i + 1)] as const,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      address: ADDR, abi: SPREAD_COLLECTION_ABI,
      functionName: 'productNFTs' as const, args: [BigInt(i + 6)] as const,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      address: ADDR, abi: SPREAD_COLLECTION_ABI,
      functionName: 'badgeTiers' as const, args: [BigInt(i + 11)] as const,
    })),
  ] as const

  const { data, isLoading } = useReadContracts({ contracts: calls })

  // Parse results
  const supplies    = data?.slice(0, 15).map(r => r.result as bigint | undefined)
  const dealData    = data?.slice(15, 20).map(r => r.result as unknown as DealNoteArr | undefined)
  const yieldBpsArr = data?.slice(20, 25).map(r => r.result as bigint | undefined)
  const productData = data?.slice(25, 30).map(r => r.result as unknown as ProductArr | undefined)
  const badgeData   = data?.slice(30, 35).map(r => r.result as unknown as BadgeArr | undefined)

  // Live aggregate stats
  const totalMintedDeals    = supplies?.slice(0, 5).reduce((s, v) => s + (v ? Number(v) : 0), 0) ?? 0
  const totalMintedProducts = supplies?.slice(5, 10).reduce((s, v) => s + (v ? Number(v) : 0), 0) ?? 0
  const totalMintedBadges   = supplies?.slice(10, 15).reduce((s, v) => s + (v ? Number(v) : 0), 0) ?? 0

  const totalCapUSD = DEAL_NOTES_META.reduce((s, d) => s + d.face * d.maxSupply, 0)
  const totalProducts = PRODUCTS_META.reduce((s, p) => s + p.maxSupply, 0)
  const totalBadges   = BADGES_META.reduce((s, b) => s + b.maxSupply, 0)

  return (
    <>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
              ST Spread Collection
            </h2>
            <p style={{ fontSize: 14, color: 'var(--steel)', maxWidth: 560 }}>
              15 tokenized positions across three distinct yield strategies.
              Each tier monetizes the spread differently — interest, royalties, or SHTX accrual.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
                ${(totalCapUSD / 1_000_000).toFixed(1)}M
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--steel)', letterSpacing: '0.06em' }}>NOTE CAPACITY</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {isLoading ? '…' : totalMintedProducts}
                <span style={{ fontSize: 13, color: 'var(--steel)', fontWeight: 400 }}>/{totalProducts}</span>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--steel)', letterSpacing: '0.06em' }}>PRODUCTS MINTED</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {isLoading ? '…' : totalMintedBadges}
                <span style={{ fontSize: 13, color: 'var(--steel)', fontWeight: 400 }}>/{totalBadges}</span>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--steel)', letterSpacing: '0.06em' }}>BADGES ISSUED</div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {([
            { id: 'all',     label: 'All 15' },
            { id: 'deal',    label: `Deal Notes (${isLoading ? '…' : totalMintedDeals} issued)` },
            { id: 'product', label: `Products (${isLoading ? '…' : totalMintedProducts} minted)` },
            { id: 'badge',   label: `Badges (${isLoading ? '…' : totalMintedBadges} issued)` },
          ] as const).map(f => (
            <button
              key={f.id}
              className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          {isLoading && (
            <span style={{ fontSize: 12, color: 'var(--steel)', fontFamily: 'var(--mono)', alignSelf: 'center' }}>
              · fetching live data…
            </span>
          )}
        </div>
      </div>

      {/* ── Tier 1: Deal Notes ── */}
      {(filter === 'all' || filter === 'deal') && (
        <>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🏠</span>
              <div>
                <div className="section-title">Tier 1 — Deal Note NFTs</div>
                <div className="section-sub">
                  Fixed-yield real estate positions · USDC repayment at maturity · Reg D 506(c)
                </div>
              </div>
            </div>
            <span className="tier-label tier-deal">IDs 1 – 5</span>
          </div>

          <div className="reg-banner">
            These tokens are securities offered under Reg D Rule 506(c). Only verified
            accredited investors may purchase. Transfers are whitelist-gated on-chain.
          </div>

          <div className="card-grid">
            {DEAL_NOTES_META.map((d, i) => (
              <DealNoteCard
                key={d.id}
                meta={d}
                supply={supplies?.[i]}
                onChain={dealData?.[i]}
                yieldBps={yieldBpsArr?.[i]}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Tier 2: Product NFTs ── */}
      {(filter === 'all' || filter === 'product') && (
        <>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>👟</span>
              <div>
                <div className="section-title">Tier 2 — KhakiSol Product NFTs</div>
                <div className="section-sub">
                  Limited-edition physical gear NFTs · 5% royalty on every secondary sale
                </div>
              </div>
            </div>
            <span className="tier-label tier-product">IDs 6 – 10</span>
          </div>

          <div className="card-grid">
            {PRODUCTS_META.map((p, i) => (
              <ProductCard
                key={p.id}
                meta={p}
                supply={supplies?.[5 + i]}
                onChain={productData?.[i]}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Tier 3: Spread Badges ── */}
      {(filter === 'all' || filter === 'badge') && (
        <>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>💎</span>
              <div>
                <div className="section-title">Tier 3 — Spread Badges</div>
                <div className="section-sub">
                  SHTX-accruing loyalty badges · Transfer cooldown prevents wash-trading
                </div>
              </div>
            </div>
            <span className="tier-label tier-badge">IDs 11 – 15</span>
          </div>

          <div className="card-grid-5">
            {BADGES_META.map((b, i) => (
              <BadgeCard
                key={b.id}
                meta={b}
                idx={i}
                supply={supplies?.[10 + i]}
                onChain={badgeData?.[i]}
              />
            ))}
          </div>

          <div className="card" style={{ marginBottom: 40 }}>
            <div className="card-name" style={{ marginBottom: 12 }}>How SHTX Accrual Works</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <div className="meta-label">Earn</div>
                <div style={{ fontSize: 13, marginTop: 4, color: 'var(--steel)' }}>
                  Hold a badge in your wallet. SHTX accrues at the tier's daily rate, tracked
                  by block timestamp. Your SHTX balance is claimable via the STLLC admin portal.
                </div>
              </div>
              <div>
                <div className="meta-label">Spend</div>
                <div style={{ fontSize: 13, marginTop: 4, color: 'var(--steel)' }}>
                  Use SHTX for discounts on KhakiSol purchases, priority access to new deal
                  note offerings, and exclusive product drops.
                </div>
              </div>
              <div>
                <div className="meta-label">Transfer Cooldown</div>
                <div style={{ fontSize: 13, marginTop: 4, color: 'var(--steel)' }}>
                  Each badge tier has a transfer lockup (7–90 days) enforced on-chain via
                  a timestamp check. This prevents wash-trading of accrued rewards.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
