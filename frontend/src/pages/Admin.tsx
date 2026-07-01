import { useState } from 'react'
import { useAccount, useReadContracts, useWriteContract } from 'wagmi'
import {
  ADDRESSES, SPREAD_COLLECTION_ABI, DEAL_NOTE_WRITE_ABI, USDC_ABI, USDC_ADDRESS,
  DEAL_NOTES_META, PRODUCTS_META, BADGES_META,
} from '../contracts'
import TxButton from '../components/TxButton'

const SC   = ADDRESSES.spreadCollection as `0x${string}`
const DN8  = ADDRESSES.dealNote008      as `0x${string}`
const USDC = USDC_ADDRESS

type Tab = 'overview' | 'whitelist' | 'mint' | 'repayment' | 'deal008'

const ALL_META = [
  ...DEAL_NOTES_META.map(d => ({ id: d.id, label: d.dealRef,  max: d.maxSupply, tier: 'deal'    as const })),
  ...PRODUCTS_META.map(p  => ({ id: p.id, label: p.name,     max: p.maxSupply, tier: 'product' as const })),
  ...BADGES_META.map(b    => ({ id: b.id, label: b.name,      max: b.maxSupply, tier: 'badge'   as const })),
]

// ── Shared form components ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--steel)', marginBottom: 6, letterSpacing: '0.05em' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '8px 12px', background: 'var(--ghost)',
        border: '1px solid var(--ghost)', borderRadius: 6, color: 'var(--ink)',
        fontFamily: 'var(--mono)', fontSize: 13, boxSizing: 'border-box',
        outline: 'none',
        ...props.style,
      }}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      style={{
        width: '100%', padding: '8px 12px', background: 'var(--ghost)',
        border: '1px solid var(--ghost)', borderRadius: 6, color: 'var(--ink)',
        fontFamily: 'var(--mono)', fontSize: 13, boxSizing: 'border-box',
        ...props.style,
      }}
    />
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-name" style={{ marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  )
}

// ── Supply bar ────────────────────────────────────────────────────────────────

function SupplyBar({ minted, max, tier }: { minted: number; max: number; tier: 'deal' | 'product' | 'badge' }) {
  const pct = max > 0 ? Math.min(100, (minted / max) * 100) : 0
  const color = tier === 'deal' ? 'var(--teal)' : tier === 'product' ? 'var(--amber)' : 'var(--purple)'
  return (
    <div style={{ flex: 1, background: 'var(--ghost)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const supplyCalls = ALL_META.map(m => ({
    address: SC,
    abi: SPREAD_COLLECTION_ABI,
    functionName: 'totalSupply' as const,
    args: [BigInt(m.id)] as const,
  }))
  const { data: supplyData, isLoading } = useReadContracts({ contracts: supplyCalls })

  const { writeContract: writePause,   isPending: pausePending,   data: pauseHash   } = useWriteContract()
  const { writeContract: writeUnpause, isPending: unpausePending, data: unpauseHash } = useWriteContract()

  const { data: pausedData, refetch: refetchPaused } = useReadContracts({
    contracts: [{ address: SC, abi: SPREAD_COLLECTION_ABI, functionName: 'paused', args: [] }],
  })
  const isPaused = pausedData?.[0]?.result as boolean | undefined

  const tiers = [
    { label: 'Deal Notes',        meta: DEAL_NOTES_META,  tier: 'deal'    as const, offset: 0  },
    { label: 'KhakiSol Products', meta: PRODUCTS_META,    tier: 'product' as const, offset: 5  },
    { label: 'Spread Badges',     meta: BADGES_META,      tier: 'badge'   as const, offset: 10 },
  ]

  const totalMinted = supplyData
    ? supplyData.reduce((s, d) => s + Number((d.result as bigint | undefined) ?? 0n), 0)
    : 0

  return (
    <>
      {/* Contract status strip */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div className="meta-label">CONTRACT STATUS</div>
              <div style={{ marginTop: 6 }}>
                {isPaused === undefined
                  ? <span style={{ color: 'var(--steel)', fontSize: 14 }}>Loading…</span>
                  : isPaused
                    ? <span className="tag tag-amber" style={{ fontSize: 13 }}>⏸ Paused</span>
                    : <span className="tag tag-teal"  style={{ fontSize: 13 }}>● Active</span>
                }
              </div>
            </div>
            <div>
              <div className="meta-label">TOTAL TOKENS ISSUED</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                {isLoading ? '…' : totalMinted.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="meta-label">CONTRACT</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--mono)', marginTop: 6, color: 'var(--steel)' }}>
                {SC.slice(0, 10)}…{SC.slice(-8)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <TxButton
              label="Pause"
              isPending={pausePending}
              hash={pauseHash}
              disabled={!!isPaused}
              style={{ minWidth: 100 }}
              onClick={() => { writePause({ address: SC, abi: SPREAD_COLLECTION_ABI, functionName: 'pause', args: [] }); setTimeout(() => refetchPaused(), 3000) }}
            />
            <TxButton
              label="Unpause"
              isPending={unpausePending}
              hash={unpauseHash}
              disabled={!isPaused}
              style={{ minWidth: 100 }}
              onClick={() => { writeUnpause({ address: SC, abi: SPREAD_COLLECTION_ABI, functionName: 'unpause', args: [] }); setTimeout(() => refetchPaused(), 3000) }}
            />
          </div>
        </div>
      </div>

      {/* Supply by tier */}
      {tiers.map(({ label, meta, tier, offset }) => (
        <SectionCard key={tier} title={label}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {meta.map((m, i) => {
              const minted = Number((supplyData?.[offset + i]?.result as bigint | undefined) ?? 0n)
              const pct = m.maxSupply > 0 ? ((minted / m.maxSupply) * 100).toFixed(1) : '0'
              const name = 'dealRef' in m ? m.dealRef : m.name
              const color = tier === 'deal' ? 'var(--teal)' : tier === 'product' ? 'var(--amber)' : 'var(--purple)'
              const full = minted >= m.maxSupply
              return (
                <div key={m.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--steel)', minWidth: 60 }}>ID {m.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                      {full && <span className="tag tag-amber" style={{ fontSize: 10 }}>FULL</span>}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color, whiteSpace: 'nowrap' }}>
                      {isLoading ? '…' : `${minted.toLocaleString()} / ${m.maxSupply.toLocaleString()}`}
                      <span style={{ color: 'var(--mist)', marginLeft: 8 }}>{pct}%</span>
                    </div>
                  </div>
                  <SupplyBar minted={minted} max={m.maxSupply} tier={tier} />
                </div>
              )
            })}
          </div>
        </SectionCard>
      ))}
    </>
  )
}

// ── Whitelist tab ─────────────────────────────────────────────────────────────

function WhitelistTab() {
  const [addr, setAddr]       = useState('')
  const [batch, setBatch]     = useState('')
  const [action, setAction]   = useState<'add' | 'remove'>('add')
  const [checkAddr, setCheckAddr] = useState('')

  const { writeContract, isPending, data: hash } = useWriteContract()

  const validCheck = /^0x[0-9a-fA-F]{40}$/.test(checkAddr)
  const { data: checkData, refetch: refetchCheck, isFetching: checkFetching } = useReadContracts({
    contracts: validCheck ? [{
      address: SC, abi: SPREAD_COLLECTION_ABI,
      functionName: 'dealWhitelist',
      args: [checkAddr as `0x${string}`],
    }] : [],
  })
  const checkResult = checkData?.[0]?.result as boolean | undefined

  function singleWhitelist() {
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return
    writeContract({
      address: SC, abi: SPREAD_COLLECTION_ABI,
      functionName: 'setDealWhitelist',
      args: [addr as `0x${string}`, action === 'add'],
    })
  }

  function batchWhitelist() {
    const addrs = batch
      .split(/[\n,]+/)
      .map(a => a.trim())
      .filter(a => /^0x[0-9a-fA-F]{40}$/.test(a)) as `0x${string}`[]
    if (!addrs.length) return
    writeContract({
      address: SC, abi: SPREAD_COLLECTION_ABI,
      functionName: 'batchSetDealWhitelist',
      args: [addrs, action === 'add'],
    })
  }

  const batchValid = batch.split(/[\n,]+/).filter(a => /^0x[0-9a-fA-F]{40}$/.test(a.trim()))

  return (
    <>
      {/* Check whitelist status */}
      <SectionCard title="Check Whitelist Status">
        <Field label="WALLET ADDRESS TO CHECK">
          <div style={{ display: 'flex', gap: 10 }}>
            <Input
              placeholder="0x…"
              value={checkAddr}
              onChange={e => setCheckAddr(e.target.value)}
            />
            <button
              className="btn btn-outline btn-sm"
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => refetchCheck()}
              disabled={!validCheck || checkFetching}
            >
              {checkFetching ? 'Checking…' : 'Check'}
            </button>
          </div>
        </Field>
        {validCheck && checkResult !== undefined && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13,
            background: checkResult ? 'rgba(0,212,170,0.08)' : 'rgba(239,68,68,0.08)',
            color: checkResult ? 'var(--teal)' : '#ef4444',
            border: `1px solid ${checkResult ? 'rgba(0,212,170,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {checkResult
              ? `✓  ${checkAddr.slice(0, 10)}…${checkAddr.slice(-8)} is whitelisted`
              : `✗  ${checkAddr.slice(0, 10)}…${checkAddr.slice(-8)} is NOT whitelisted`}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Single Investor">
        <Field label="INVESTOR WALLET ADDRESS">
          <Input placeholder="0x…" value={addr} onChange={e => setAddr(e.target.value)} />
        </Field>
        <Field label="ACTION">
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${action === 'add' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAction('add')}>
              Whitelist
            </button>
            <button
              className={`btn btn-sm ${action === 'remove' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAction('remove')}
              style={{ '--btn-color': 'var(--amber)' } as React.CSSProperties}
            >
              Remove
            </button>
          </div>
        </Field>
        <TxButton
          label={action === 'add' ? 'Add to Whitelist' : 'Remove from Whitelist'}
          isPending={isPending}
          hash={hash}
          disabled={!/^0x[0-9a-fA-F]{40}$/.test(addr)}
          onClick={singleWhitelist}
        />
      </SectionCard>

      <SectionCard title="Batch Whitelist">
        <Field label="ADDRESSES (one per line or comma-separated)">
          <textarea
            value={batch}
            onChange={e => setBatch(e.target.value)}
            rows={5}
            placeholder={'0xabc…\n0xdef…'}
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--ghost)',
              border: '1px solid var(--ghost)', borderRadius: 6, color: 'var(--ink)',
              fontFamily: 'var(--mono)', fontSize: 12, boxSizing: 'border-box', resize: 'vertical',
            }}
          />
        </Field>
        <div style={{ fontSize: 12, color: 'var(--steel)', marginBottom: 12 }}>
          {batchValid.length} valid address{batchValid.length !== 1 ? 'es' : ''} detected
        </div>
        <TxButton
          label={`Batch ${action === 'add' ? 'Add' : 'Remove'} (${batchValid.length} addresses)`}
          isPending={isPending}
          hash={hash}
          disabled={batchValid.length === 0}
          onClick={batchWhitelist}
        />
      </SectionCard>
    </>
  )
}

// ── Mint tab ──────────────────────────────────────────────────────────────────

function MintTab() {
  const [recipient, setRecipient]     = useState('')
  const [dealId, setDealId]           = useState('1')
  const [dealAmount, setDealAmount]   = useState('1')
  const [productId, setProductId]     = useState('6')
  const [badgeId, setBadgeId]         = useState('11')
  const [badgeAmount, setBadgeAmount] = useState('1')

  const { writeContract: writeIssue,   isPending: pendingIssue,   data: hashIssue   } = useWriteContract()
  const { writeContract: writeProduct, isPending: pendingProduct, data: hashProduct } = useWriteContract()
  const { writeContract: writeBadge,   isPending: pendingBadge,   data: hashBadge   } = useWriteContract()

  const validAddr = /^0x[0-9a-fA-F]{40}$/.test(recipient)

  // Check whitelist status for the entered recipient
  const { data: wlData } = useReadContracts({
    contracts: validAddr ? [{
      address: SC, abi: SPREAD_COLLECTION_ABI,
      functionName: 'dealWhitelist',
      args: [recipient as `0x${string}`],
    }] : [],
  })
  const isWhitelisted = wlData?.[0]?.result as boolean | undefined

  const sharedRecipientField = (
    <Field label="RECIPIENT ADDRESS">
      <Input placeholder="0x…" value={recipient} onChange={e => setRecipient(e.target.value)} />
      {validAddr && isWhitelisted !== undefined && (
        <div style={{ fontSize: 12, marginTop: 6, color: isWhitelisted ? 'var(--teal)' : 'var(--amber)' }}>
          {isWhitelisted ? '✓ Whitelisted' : '⚠ Not whitelisted — deal note issuance will fail'}
        </div>
      )}
    </Field>
  )

  return (
    <>
      <SectionCard title="Issue Deal Note (Spread Collection · IDs 1–5)">
        <div className="reg-banner" style={{ marginBottom: 20 }}>
          Investor must be whitelisted before issuance. USDC repayment must be deposited before redemption.
        </div>
        {sharedRecipientField}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="DEAL NOTE (TOKEN ID 1–5)">
            <Select value={dealId} onChange={e => setDealId(e.target.value)}>
              {DEAL_NOTES_META.map(d => (
                <option key={d.id} value={d.id}>{d.dealRef} — {d.yieldPct}% yield (ID {d.id})</option>
              ))}
            </Select>
          </Field>
          <Field label="AMOUNT">
            <Input type="number" min="1" value={dealAmount} onChange={e => setDealAmount(e.target.value)} />
          </Field>
        </div>
        {DEAL_NOTES_META.find(d => d.id === +dealId) && (
          <div style={{ fontSize: 12, color: 'var(--steel)', marginBottom: 16, fontFamily: 'var(--mono)' }}>
            {(() => {
              const d = DEAL_NOTES_META.find(d => d.id === +dealId)!
              const amt = +dealAmount || 0
              return `Face: $${(d.face * amt).toLocaleString()} → Repayment: $${(d.repayment * amt).toLocaleString()} (${d.yieldPct}% / ${d.termMonths}mo)`
            })()}
          </div>
        )}
        <TxButton
          label={`Issue ${dealAmount} × ${DEAL_NOTES_META.find(d => d.id === +dealId)?.dealRef}`}
          isPending={pendingIssue}
          hash={hashIssue}
          disabled={!validAddr || +dealAmount < 1}
          onClick={() => writeIssue({
            address: SC, abi: SPREAD_COLLECTION_ABI,
            functionName: 'issueDealNote',
            args: [BigInt(dealId), recipient as `0x${string}`, BigInt(dealAmount)],
          })}
        />
      </SectionCard>

      <SectionCard title="Mint Product NFT (KhakiSol · IDs 6–10)">
        {sharedRecipientField}
        <Field label="PRODUCT (TOKEN ID 6–10)">
          <Select value={productId} onChange={e => setProductId(e.target.value)}>
            {PRODUCTS_META.map(p => (
              <option key={p.id} value={p.id}>{p.name} — ${p.priceUSD.toFixed(2)} (ID {p.id})</option>
            ))}
          </Select>
        </Field>
        <TxButton
          label={`Mint ${PRODUCTS_META.find(p => p.id === +productId)?.name}`}
          isPending={pendingProduct}
          hash={hashProduct}
          disabled={!validAddr}
          onClick={() => writeProduct({
            address: SC, abi: SPREAD_COLLECTION_ABI,
            functionName: 'mintProductNFT',
            args: [recipient as `0x${string}`, BigInt(productId)],
          })}
        />
      </SectionCard>

      <SectionCard title="Issue Spread Badge (IDs 11–15)">
        {sharedRecipientField}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="BADGE TIER (TOKEN ID 11–15)">
            <Select value={badgeId} onChange={e => setBadgeId(e.target.value)}>
              {BADGES_META.map(b => (
                <option key={b.id} value={b.id}>{b.name} — {b.shtxPerDay} SHTX/day (ID {b.id})</option>
              ))}
            </Select>
          </Field>
          <Field label="AMOUNT">
            <Input type="number" min="1" value={badgeAmount} onChange={e => setBadgeAmount(e.target.value)} />
          </Field>
        </div>
        <TxButton
          label={`Issue ${badgeAmount} × ${BADGES_META.find(b => b.id === +badgeId)?.name}`}
          isPending={pendingBadge}
          hash={hashBadge}
          disabled={!validAddr || +badgeAmount < 1}
          onClick={() => writeBadge({
            address: SC, abi: SPREAD_COLLECTION_ABI,
            functionName: 'mintBadge',
            args: [recipient as `0x${string}`, BigInt(badgeId), BigInt(badgeAmount)],
          })}
        />
      </SectionCard>
    </>
  )
}

// ── Repayment tab ─────────────────────────────────────────────────────────────

function RepaymentTab({ userAddress }: { userAddress: `0x${string}` }) {
  const [dealId, setDealId]   = useState('1')
  const [usdcAmt, setUsdcAmt] = useState('')

  const { data: allowanceData } = useReadContracts({
    contracts: [
      { address: USDC, abi: USDC_ABI, functionName: 'allowance', args: [userAddress, SC] },
      { address: USDC, abi: USDC_ABI, functionName: 'balanceOf', args: [userAddress] },
    ],
  })
  const allowance  = allowanceData?.[0]?.result as bigint | undefined
  const usdcBal    = allowanceData?.[1]?.result as bigint | undefined
  const usdcAmtRaw = BigInt(Math.round(parseFloat(usdcAmt || '0') * 1e6))
  const needsApprove = !allowance || allowance < usdcAmtRaw

  const { writeContract: writeApprove, isPending: pendingApprove, data: hashApprove } = useWriteContract()
  const { writeContract: writeDeposit, isPending: pendingDeposit, data: hashDeposit } = useWriteContract()

  const deal = DEAL_NOTES_META.find(d => d.id === +dealId)

  return (
    <SectionCard title="Deposit USDC Repayment (Spread Collection)">
      <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div className="meta-label">YOUR USDC BALANCE</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--teal)' }}>
            ${usdcBal ? (Number(usdcBal) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
          </div>
        </div>
        {deal && (
          <div>
            <div className="meta-label">FULL REPAYMENT FOR {deal.dealRef}</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--mono)', marginTop: 6, color: 'var(--steel)' }}>
              ${(deal.repayment * deal.maxSupply).toLocaleString()} USDC ({deal.maxSupply.toLocaleString()} × ${deal.repayment})
            </div>
          </div>
        )}
      </div>
      <Field label="DEAL NOTE (TOKEN ID 1–5)">
        <Select value={dealId} onChange={e => setDealId(e.target.value)}>
          {DEAL_NOTES_META.map(d => (
            <option key={d.id} value={d.id}>{d.dealRef} — ${d.repayment} repayment (ID {d.id})</option>
          ))}
        </Select>
      </Field>
      <Field label="USDC AMOUNT">
        <Input
          type="number" min="0" step="0.01"
          placeholder={deal ? `e.g. ${(deal.repayment * deal.maxSupply).toLocaleString()}` : ''}
          value={usdcAmt}
          onChange={e => setUsdcAmt(e.target.value)}
        />
      </Field>
      {needsApprove ? (
        <TxButton
          label={`Approve USDC ($${usdcAmt || '0'})`}
          isPending={pendingApprove}
          hash={hashApprove}
          disabled={!usdcAmt || parseFloat(usdcAmt) <= 0}
          onClick={() => writeApprove({
            address: USDC, abi: USDC_ABI,
            functionName: 'approve',
            args: [SC, usdcAmtRaw],
          })}
        />
      ) : (
        <TxButton
          label={`Deposit $${usdcAmt} USDC → ${DEAL_NOTES_META.find(d => d.id === +dealId)?.dealRef}`}
          isPending={pendingDeposit}
          hash={hashDeposit}
          disabled={!usdcAmt || parseFloat(usdcAmt) <= 0}
          onClick={() => writeDeposit({
            address: SC, abi: SPREAD_COLLECTION_ABI,
            functionName: 'depositRepayment',
            args: [BigInt(dealId), usdcAmtRaw],
          })}
        />
      )}
    </SectionCard>
  )
}

// ── Deal-008 tab ──────────────────────────────────────────────────────────────

function Deal008Tab({ userAddress }: { userAddress: `0x${string}` }) {
  const [investorAddr, setInvestorAddr] = useState('')
  const [issueAmount, setIssueAmount]   = useState('1')
  const [repayAmount, setRepayAmount]   = useState('')

  const { data: contractData } = useReadContracts({
    contracts: [
      { address: DN8,  abi: DEAL_NOTE_WRITE_ABI, functionName: 'totalSupply', args: [] },
      { address: DN8,  abi: DEAL_NOTE_WRITE_ABI, functionName: 'matured',     args: [] },
      { address: DN8,  abi: USDC_ABI,            functionName: 'balanceOf',   args: [userAddress] },
      { address: USDC, abi: USDC_ABI,            functionName: 'allowance',   args: [userAddress, DN8] },
    ],
  })
  const totalSupply = contractData?.[0]?.result as bigint | undefined
  const matured     = contractData?.[1]?.result as boolean | undefined
  const usdcBal     = contractData?.[2]?.result as bigint | undefined
  const allowance   = contractData?.[3]?.result as bigint | undefined

  const repayRaw     = BigInt(Math.round(parseFloat(repayAmount || '0') * 1e6))
  const needsApprove = !allowance || allowance < repayRaw
  const validInvestor = /^0x[0-9a-fA-F]{40}$/.test(investorAddr)

  const { writeContract: writeIssue,   isPending: pendingIssue,   data: hashIssue   } = useWriteContract()
  const { writeContract: writeApprove, isPending: pendingApprove, data: hashApprove } = useWriteContract()
  const { writeContract: writeRepay,   isPending: pendingRepay,   data: hashRepay   } = useWriteContract()

  const totalIssued = totalSupply ? Number(totalSupply) / 1e18 : 0

  return (
    <>
      <SectionCard title="ST-DEAL-008 Status">
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div className="meta-label">TOKENS ISSUED</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {totalSupply !== undefined ? totalIssued.toLocaleString() : '—'}
              <span style={{ fontSize: 13, color: 'var(--steel)', marginLeft: 8 }}>/ 1,290 max</span>
            </div>
          </div>
          <div>
            <div className="meta-label">STATUS</div>
            <div style={{ marginTop: 6 }}>
              {matured === undefined
                ? <span style={{ color: 'var(--steel)' }}>—</span>
                : matured
                  ? <span className="tag tag-amber">Matured</span>
                  : <span className="tag tag-teal">Active</span>
              }
            </div>
          </div>
          <div>
            <div className="meta-label">YOUR USDC</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              ${usdcBal ? (Number(usdcBal) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
            </div>
          </div>
        </div>
        {totalSupply !== undefined && (
          <SupplyBar minted={totalIssued} max={1290} tier="deal" />
        )}
      </SectionCard>

      <SectionCard title="Issue ST-DEAL-008 Tokens">
        <Field label="INVESTOR ADDRESS">
          <Input placeholder="0x…" value={investorAddr} onChange={e => setInvestorAddr(e.target.value)} />
        </Field>
        <Field label="TOKEN AMOUNT (1 token = $100 face value)">
          <Input type="number" min="1" value={issueAmount} onChange={e => setIssueAmount(e.target.value)} />
          <div style={{ fontSize: 12, color: 'var(--steel)', marginTop: 4 }}>
            Face: ${(+issueAmount * 100).toLocaleString()} → Repayment: ${(+issueAmount * 106).toLocaleString()} (6% yield)
          </div>
        </Field>
        <TxButton
          label={`Issue ${issueAmount} tokens to investor`}
          isPending={pendingIssue}
          hash={hashIssue}
          disabled={!validInvestor || +issueAmount < 1}
          onClick={() => writeIssue({
            address: DN8, abi: DEAL_NOTE_WRITE_ABI,
            functionName: 'issueTokens',
            args: [investorAddr as `0x${string}`, BigInt(issueAmount) * BigInt(1e18)],
          })}
        />
      </SectionCard>

      <SectionCard title="Deposit Repayment (ST-DEAL-008)">
        <Field label="USDC AMOUNT TO DEPOSIT">
          <Input
            type="number" min="0" step="0.01"
            placeholder="e.g. 136740"
            value={repayAmount}
            onChange={e => setRepayAmount(e.target.value)}
          />
        </Field>
        {needsApprove ? (
          <TxButton
            label={`Approve USDC ($${repayAmount || '0'})`}
            isPending={pendingApprove}
            hash={hashApprove}
            disabled={!repayAmount || parseFloat(repayAmount) <= 0}
            onClick={() => writeApprove({
              address: USDC, abi: USDC_ABI,
              functionName: 'approve',
              args: [DN8, repayRaw],
            })}
          />
        ) : (
          <TxButton
            label={`Deposit $${repayAmount} USDC`}
            isPending={pendingRepay}
            hash={hashRepay}
            disabled={!repayAmount || parseFloat(repayAmount) <= 0}
            onClick={() => writeRepay({
              address: DN8, abi: DEAL_NOTE_WRITE_ABI,
              functionName: 'depositRepayment',
              args: [repayRaw],
            })}
          />
        )}
      </SectionCard>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Admin() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>('overview')

  const { data: roleData } = useReadContracts({
    contracts: address ? [
      { address: SC, abi: SPREAD_COLLECTION_ABI, functionName: 'MANAGER_ROLE', args: [] },
    ] : [],
  })
  const managerRole = roleData?.[0]?.result as `0x${string}` | undefined

  const { data: hasRoleData } = useReadContracts({
    contracts: address && managerRole ? [
      { address: SC, abi: SPREAD_COLLECTION_ABI, functionName: 'hasRole', args: [managerRole, address] },
    ] : [],
  })
  const isManager = hasRoleData?.[0]?.result as boolean | undefined

  if (!isConnected || !address) {
    return (
      <div className="empty">
        <div className="empty-icon">🔐</div>
        <div className="empty-title">Connect your wallet</div>
        <div className="empty-body">Admin access requires the MANAGER_ROLE on Polygon Mainnet.</div>
      </div>
    )
  }

  if (isManager === false) {
    return (
      <div className="empty">
        <div className="empty-icon">🚫</div>
        <div className="empty-title">Access denied</div>
        <div className="empty-body">
          {address.slice(0, 10)}…{address.slice(-8)} does not hold MANAGER_ROLE on STSpreadCollection.
        </div>
      </div>
    )
  }

  const TABS = [
    { id: 'overview'  as const, label: 'Overview'     },
    { id: 'whitelist' as const, label: 'Whitelist'    },
    { id: 'mint'      as const, label: 'Issue / Mint' },
    { id: 'repayment' as const, label: 'Repayment'    },
    { id: 'deal008'   as const, label: 'ST-DEAL-008'  },
  ]

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Admin Dashboard
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--steel)' }}>
            {address.slice(0, 10)}…{address.slice(-8)}
          </div>
          <span className="tag tag-teal">Manager</span>
          <span className="tag tag-teal">Polygon</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab />}
      {tab === 'whitelist' && <WhitelistTab />}
      {tab === 'mint'      && <MintTab />}
      {tab === 'repayment' && <RepaymentTab userAddress={address} />}
      {tab === 'deal008'   && <Deal008Tab userAddress={address} />}
    </>
  )
}
