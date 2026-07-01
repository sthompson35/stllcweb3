import { useState } from 'react'
import { useAccount } from 'wagmi'

const API_BASE = (import.meta as any).env?.VITE_ONRAMP_API ?? 'http://localhost:4041'

type SessionResp =
  | { onrampUrl: string; quote?: unknown }
  | { error: string; configured?: boolean; hint?: string }

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'unconfigured'; hint: string }
  | { kind: 'error'; msg: string }

export default function CoinbaseOnrampButton({
  defaultAmount = 100,
}: {
  defaultAmount?: number
}) {
  const { address, isConnected } = useAccount()
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function openOnramp() {
    if (!address) return
    setState({ kind: 'loading' })
    try {
      const r = await fetch(`${API_BASE}/api/onramp/session-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          purchaseCurrency:   'USDC',
          destinationNetwork: 'polygon',
          paymentAmount:      String(defaultAmount),
          paymentCurrency:    'USD',
        }),
      })
      const data: SessionResp = await r.json()

      if (!r.ok) {
        if ((data as any).configured === false) {
          setState({ kind: 'unconfigured', hint: (data as any).hint || 'Set CDP credentials in .env' })
        } else {
          setState({ kind: 'error', msg: (data as any).error || `HTTP ${r.status}` })
        }
        return
      }

      const onrampUrl = (data as any).onrampUrl
      if (!onrampUrl) {
        setState({ kind: 'error', msg: 'CDP returned no onrampUrl' })
        return
      }

      const w = 480
      const h = 720
      const left = window.screenX + (window.outerWidth - w) / 2
      const top  = window.screenY + (window.outerHeight - h) / 2
      window.open(
        onrampUrl,
        'coinbase-onramp',
        `width=${w},height=${h},left=${left},top=${top},popup=yes`
      )
      setState({ kind: 'idle' })
    } catch (e: any) {
      setState({ kind: 'error', msg: e?.message || 'Unknown error' })
    }
  }

  if (!isConnected) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="card-name">Buy USDC on Polygon</div>
        <div className="card-ref" style={{ marginTop: 4, marginBottom: 12 }}>
          Connect wallet to enable Coinbase Onramp
        </div>
        <button className="btn btn-outline btn-sm" disabled>
          Connect wallet first
        </button>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <img
          src="https://www.coinbase.com/favicon.ico"
          alt=""
          style={{ width: 24, height: 24, borderRadius: 4 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="card-name" style={{ margin: 0 }}>Buy USDC on Polygon</div>
      </div>
      <div className="card-ref" style={{ marginBottom: 16 }}>
        Card · Bank · Apple/Google Pay · PayPal · ACH — funds delivered to your wallet
      </div>

      <button
        className="btn btn-primary"
        onClick={openOnramp}
        disabled={state.kind === 'loading'}
        style={{ width: '100%' }}
      >
        {state.kind === 'loading' ? 'Opening Coinbase…' : `Buy $${defaultAmount} USDC`}
      </button>

      {state.kind === 'unconfigured' && (
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, fontSize: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>⚙️ Coinbase Onramp not configured</div>
          <div style={{ color: 'var(--steel)' }}>{state.hint}</div>
          <div style={{ marginTop: 6, color: 'var(--steel)' }}>
            Get credentials at <a href="https://portal.cdp.coinbase.com/" target="_blank" rel="noreferrer">portal.cdp.coinbase.com</a>
          </div>
        </div>
      )}
      {state.kind === 'error' && (
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, fontSize: 12, color: 'var(--steel)' }}>
          Error: {state.msg}
        </div>
      )}
    </div>
  )
}
