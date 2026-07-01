import { useAccount, useReadContracts, useWriteContract } from 'wagmi'
import { ADDRESSES, ERC20_ABI, DEAL_NOTE_ABI, DEAL_NOTE_WRITE_ABI, SPREAD_COLLECTION_ABI, ERC1155_ABI, DEAL_NOTES_META, PRODUCTS_META, BADGES_META, BADGES_META as BM } from '../contracts'
import TxButton from '../components/TxButton'
import CoinbaseOnrampButton from '../components/CoinbaseOnrampButton'

function fmt18(raw?: bigint) {
  if (!raw) return '0'
  const n = Number(raw) / 1e18
  return n < 0.01 ? '<0.01' : n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function fmt6(raw?: bigint) {
  if (!raw) return '0'
  return (Number(raw) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function HoldingCard({ label, value, sub, color = 'var(--teal)', addr }: {
  label: string; value: string; sub?: string; color?: string; addr?: string
}) {
  return (
    <div className="holding-card">
      <div className="holding-amount" style={{ color }}>{value}</div>
      <div className="holding-label">{label}</div>
      {sub && <div className="holding-addr">{sub}</div>}
      {addr && (
        <div className="holding-addr" title={addr}>
          {addr.slice(0, 8)}…{addr.slice(-6)}
        </div>
      )}
    </div>
  )
}

function RedeemNote008({ noteBal, noteMatured }: { noteBal: bigint; noteMatured: boolean }) {
  const { writeContract, data: hash, isPending } = useWriteContract()
  if (!noteMatured || !noteBal || noteBal === 0n) return null
  return (
    <div style={{ marginTop: 12 }}>
      <TxButton
        label="Redeem Notes"
        pendingLabel="Redeeming…"
        hash={hash}
        isPending={isPending}
        onClick={() => writeContract({
          address: ADDRESSES.dealNote008 as `0x${string}`,
          abi: DEAL_NOTE_WRITE_ABI,
          functionName: 'redeem',
          args: [noteBal],
        })}
      />
    </div>
  )
}

function RedeemSpreadNote({ tokenId, bal, matured }: { tokenId: number; bal: bigint; matured: boolean }) {
  const { writeContract, data: hash, isPending } = useWriteContract()
  if (!matured || !bal || bal === 0n) return null
  return (
    <div style={{ marginTop: 12 }}>
      <TxButton
        label="Redeem"
        pendingLabel="Redeeming…"
        hash={hash}
        isPending={isPending}
        onClick={() => writeContract({
          address: ADDRESSES.spreadCollection as `0x${string}`,
          abi: SPREAD_COLLECTION_ABI,
          functionName: 'redeemDealNote',
          args: [BigInt(tokenId), bal],
        })}
      />
    </div>
  )
}

function ConnectedPortfolio({ address }: { address: `0x${string}` }) {
  // ERC-20 balances
  const erc20Calls = [
    { address: ADDRESSES.equity      as `0x${string}`, abi: ERC20_ABI,      functionName: 'balanceOf', args: [address] },
    { address: ADDRESSES.dealNote008 as `0x${string}`, abi: DEAL_NOTE_ABI,  functionName: 'balanceOf', args: [address] },
    { address: ADDRESSES.shtx        as `0x${string}`, abi: ERC20_ABI,      functionName: 'balanceOf', args: [address] },
    { address: ADDRESSES.dealNote008 as `0x${string}`, abi: DEAL_NOTE_ABI,  functionName: 'matured',   args: [] },
    { address: ADDRESSES.dealNote008 as `0x${string}`, abi: DEAL_NOTE_ABI,  functionName: 'impliedAnnualYieldBps', args: [] },
  ] as const

  const { data: erc20Data, isLoading: loading20 } = useReadContracts({ contracts: erc20Calls })

  const equityBal   = erc20Data?.[0]?.result as bigint | undefined
  const noteBal     = erc20Data?.[1]?.result as bigint | undefined
  const shtxBal     = erc20Data?.[2]?.result as bigint | undefined
  const noteMatured = erc20Data?.[3]?.result as boolean | undefined
  const yieldBps    = erc20Data?.[4]?.result as bigint | undefined
  const annualYield = yieldBps ? (Number(yieldBps) / 100).toFixed(2) : '—'

  // ERC-1155 balances: KhakiSol (IDs 1–5) + STSpreadCollection (IDs 1–15)
  const khakiCalls = [1, 2, 3, 4, 5].map(id => ({
    address: ADDRESSES.khakiSol as `0x${string}`,
    abi: ERC1155_ABI,
    functionName: 'balanceOf' as const,
    args: [address, BigInt(id)] as const,
  }))
  const spreadCalls = Array.from({ length: 15 }, (_, i) => ({
    address: ADDRESSES.spreadCollection as `0x${string}`,
    abi: ERC1155_ABI,
    functionName: 'balanceOf' as const,
    args: [address, BigInt(i + 1)] as const,
  }))

  // Read maturity status for spread collection deal notes (IDs 1–5)
  const spreadMaturityCalls = [1, 2, 3, 4, 5].map(id => ({
    address: ADDRESSES.spreadCollection as `0x${string}`,
    abi: SPREAD_COLLECTION_ABI,
    functionName: 'dealNotes' as const,
    args: [BigInt(id)] as const,
  }))

  const { data: khakiData,  isLoading: loadingKhaki  } = useReadContracts({ contracts: khakiCalls })
  const { data: spreadData, isLoading: loadingSpread } = useReadContracts({ contracts: spreadCalls })
  const { data: spreadMaturityData } = useReadContracts({ contracts: spreadMaturityCalls })

  const hasAnyHolding =
    (equityBal && equityBal > 0n) ||
    (noteBal   && noteBal   > 0n) ||
    (shtxBal   && shtxBal   > 0n) ||
    (khakiData  && khakiData.some(d  => d.result  && (d.result  as bigint) > 0n)) ||
    (spreadData && spreadData.some(d => d.result && (d.result as bigint) > 0n))

  if (loading20 || loadingKhaki || loadingSpread) {
    return (
      <div className="empty">
        <div className="empty-icon">⏳</div>
        <div className="empty-title">Loading holdings…</div>
        <div className="empty-body">Reading on-chain balances from Polygon Mainnet.</div>
      </div>
    )
  }

  return (
    <>
      {/* ERC-20 holdings */}
      {(equityBal && equityBal > 0n || noteBal && noteBal > 0n || shtxBal && shtxBal > 0n) ? (
        <>
          <div className="section-header">
            <div className="section-title">Token Holdings</div>
          </div>
          <div className="portfolio-grid" style={{ marginBottom: 32 }}>
            {equityBal && equityBal > 0n ? (
              <HoldingCard
                label="STLLC Equity Tokens"
                value={fmt18(equityBal)}
                sub="Fractional LLC equity · ERC-20"
                color="var(--teal)"
                addr={ADDRESSES.equity}
              />
            ) : null}

            {noteBal && noteBal > 0n ? (
              <div className="holding-card">
                <div className="holding-amount" style={{ color: noteMatured ? 'var(--amber)' : 'var(--teal)' }}>{fmt18(noteBal)}</div>
                <div className="holding-label">ST-DEAL-008 Notes</div>
                <div className="holding-addr">{noteMatured ? 'Matured · redeem now' : `${annualYield}% implied yield`}</div>
                <div className="holding-addr" title={ADDRESSES.dealNote008}>
                  {ADDRESSES.dealNote008.slice(0, 8)}…{ADDRESSES.dealNote008.slice(-6)}
                </div>
                <RedeemNote008 noteBal={noteBal} noteMatured={!!noteMatured} />
              </div>
            ) : null}

            {shtxBal && shtxBal > 0n ? (
              <HoldingCard
                label="SHTX Utility Tokens"
                value={fmt18(shtxBal)}
                sub="KhakiSol loyalty rewards · ERC-20"
                color="var(--purple)"
                addr={ADDRESSES.shtx}
              />
            ) : null}
          </div>
        </>
      ) : null}

      {/* KhakiSol badges */}
      {khakiData && khakiData.some(d => d.result && (d.result as bigint) > 0n) ? (
        <>
          <div className="section-header">
            <div className="section-title">KhakiSol Loyalty Badges</div>
          </div>
          <div className="portfolio-grid" style={{ marginBottom: 32 }}>
            {khakiData.map((d, i) => {
              const bal = d.result as bigint | undefined
              if (!bal || bal === 0n) return null
              const labels = ['Scout Badge', 'Operator Badge', 'Trooper Badge', 'Commander Badge', 'Founding Member']
              return (
                <HoldingCard
                  key={i}
                  label={labels[i]}
                  value={bal.toString()}
                  sub={`KhakiSol Loyalty · ID ${i + 1}`}
                  color="var(--amber)"
                  addr={ADDRESSES.khakiSol}
                />
              )
            })}
          </div>
        </>
      ) : null}

      {/* ST Spread Collection — live on-chain balances */}
      {spreadData && spreadData.some(d => d.result && (d.result as bigint) > 0n) ? (
        <>
          <div className="section-header">
            <div className="section-title">ST Spread Collection</div>
            <span className="tag tag-teal">Live</span>
          </div>
          <div className="portfolio-grid" style={{ marginBottom: 32 }}>
            {spreadData.map((d, i) => {
              const bal = d.result as bigint | undefined
              if (!bal || bal === 0n) return null
              const tokenId = i + 1
              const isDealNote = tokenId <= 5
              const tier = isDealNote ? 'Deal Note' : tokenId <= 10 ? 'Product NFT' : 'Spread Badge'
              const color = isDealNote ? 'var(--teal)' : tokenId <= 10 ? 'var(--amber)' : 'var(--purple)'
              const allMeta = [...DEAL_NOTES_META, ...PRODUCTS_META, ...BADGES_META]
              const meta = allMeta.find(m => m.id === tokenId)
              const label = meta ? ('name' in meta ? meta.name : meta.dealRef) : `Token ID ${tokenId}`
              // dealNotes struct: [dealRef, propertyAddress, face, repayment, maturity, maxSupply, arv, matured, ...]
              const matured = isDealNote
                ? (spreadMaturityData?.[i]?.result as readonly unknown[] | undefined)?.[7] as boolean | undefined
                : false
              const cardColor = isDealNote && matured ? 'var(--amber)' : color
              return (
                <div key={tokenId} className="holding-card">
                  <div className="holding-amount" style={{ color: cardColor }}>{bal.toString()}</div>
                  <div className="holding-label">{label}</div>
                  <div className="holding-addr">{isDealNote && matured ? 'Matured · redeem now' : `${tier} · ID ${tokenId}`}</div>
                  <div className="holding-addr" title={ADDRESSES.spreadCollection}>
                    {ADDRESSES.spreadCollection.slice(0, 8)}…{ADDRESSES.spreadCollection.slice(-6)}
                  </div>
                  {isDealNote && (
                    <RedeemSpreadNote tokenId={tokenId} bal={bal} matured={!!matured} />
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {/* Empty state */}
      {!hasAnyHolding && (
        <div className="empty" style={{ paddingTop: 32 }}>
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No holdings found</div>
          <div className="empty-body">
            This wallet has no STLLC tokens yet. Browse the Spread Collection
            or contact STLLC to begin the KYC process.
          </div>
        </div>
      )}
    </>
  )
}

export default function Portfolio() {
  const { address, isConnected } = useAccount()

  if (!isConnected || !address) {
    return (
      <div className="empty">
        <div className="empty-icon">🔐</div>
        <div className="empty-title">Connect your wallet</div>
        <div className="empty-body">
          Connect MetaMask or Coinbase Wallet on Polygon Mainnet to view your
          STLLC token holdings and deal note positions.
        </div>
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--mist)', fontFamily: 'var(--mono)' }}>
            Reg D 506(c) · Accredited investors only · Chain ID 137
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
          My Portfolio
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--steel)' }}>
            {address.slice(0, 10)}…{address.slice(-8)}
          </div>
          <span className="tag tag-teal">Polygon</span>
        </div>
      </div>

      <ConnectedPortfolio address={address} />

      {/* Fund wallet via Coinbase Onramp */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <div>
          <div className="section-title">Fund Wallet</div>
          <div className="section-sub">Buy USDC on Polygon to invest in deal notes or equity</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 420px)', marginBottom: 32 }}>
        <CoinbaseOnrampButton defaultAmount={100} />
      </div>
    </>
  )
}
