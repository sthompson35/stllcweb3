import { useState } from 'react'
import { useAccount } from 'wagmi'

const env = (import.meta as unknown as { env: Record<string, string> }).env
const FORMSPREE_ID = env.VITE_FORMSPREE_ID || ''

const INTERESTS = [
  { value: 'Deal Notes',     desc: '6–8% fixed yield · USDC repayment · first-lien collateral' },
  { value: 'Product NFTs',   desc: 'KhakiSol · 5% royalty · physical product redemption' },
  { value: 'Spread Badges',  desc: 'SHTX accrual · loyalty tiers · community access' },
]

const ACCREDITED_BASES = [
  { value: 'income_individual', label: 'Individual income exceeding $200,000 in each of the past two years, with a reasonable expectation of the same this year' },
  { value: 'income_joint',      label: 'Joint income with spouse/partner exceeding $300,000 in each of the past two years, with the same expectation this year' },
  { value: 'net_worth',         label: 'Net worth exceeding $1,000,000, excluding the value of my primary residence' },
  { value: 'license',           label: 'I hold a valid Series 7, Series 65, or Series 82 license in good standing' },
  { value: 'entity',            label: 'I represent an entity with total assets exceeding $5,000,000 not formed for the specific purpose of investing here' },
]

interface FormState {
  fullName: string
  email: string
  phone: string
  walletAddress: string
  interests: string[]
  accreditedBasis: string
  certify: boolean
  signature: string
}

export default function Apply() {
  const { address } = useAccount()

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    walletAddress: address ?? '',
    interests: [],
    accreditedBasis: '',
    certify: false,
    signature: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(name: string, value: string | boolean) {
    setForm(f => ({ ...f, [name]: value }))
  }

  function toggleInterest(val: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(val)
        ? f.interests.filter(i => i !== val)
        : [...f.interests, val],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!form.accreditedBasis) {
      setErrorMsg('Please select the basis for your accredited investor status.')
      return
    }
    if (!form.certify) {
      setErrorMsg('You must certify the attestation to continue.')
      return
    }
    if (form.signature.trim().toLowerCase() !== form.fullName.trim().toLowerCase()) {
      setErrorMsg('Electronic signature must match your full legal name exactly.')
      return
    }

    setStatus('submitting')

    try {
      if (!FORMSPREE_ID) throw new Error('NO_ENDPOINT')

      const resp = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          'Full Name':           form.fullName,
          'Email':               form.email,
          'Phone':               form.phone || '—',
          'Wallet Address':      form.walletAddress,
          'Investment Interest': form.interests.join(', ') || 'Not specified',
          'Accredited Basis':    form.accreditedBasis,
          'Certified':           'Yes — self-attestation signed',
          'Electronic Signature': form.signature,
          'Submitted At':        new Date().toISOString(),
        }),
      })
      if (!resp.ok) throw new Error('FETCH_FAILED')
      setStatus('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'NO_ENDPOINT') {
        setErrorMsg('Form endpoint not configured. Add VITE_FORMSPREE_ID to .env.')
      } else {
        setErrorMsg('Submission failed. Please try again or email invest@stllc.io directly.')
      }
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <>
        <div className="hero">
          <div className="hero-eyebrow">Application Received</div>
          <h1 className="hero-title">Thank You, {form.fullName.split(' ')[0]}.</h1>
          <p className="hero-body">
            Your investor application has been submitted. STLLC will review your
            accreditation attestation and contact you at <strong>{form.email}</strong> within
            2–3 business days. Once approved, your wallet will be whitelisted for deal access.
          </p>
        </div>
        <div className="card">
          <div className="card-name" style={{ marginBottom: 16 }}>What happens next</div>
          <ol style={{ paddingLeft: 20, lineHeight: 2.2, color: 'var(--steel)', fontSize: 14 }}>
            <li>STLLC reviews your accreditation attestation</li>
            <li>You may be contacted to provide supporting documentation</li>
            <li>Your wallet address is whitelisted on the Polygon smart contract</li>
            <li>You receive a confirmation email and can access deal notes via My Portfolio</li>
          </ol>
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--teal-light)', borderRadius: 8, fontSize: 13, color: 'var(--teal)' }}>
            Wallet submitted: <span style={{ fontFamily: 'var(--mono)' }}>{form.walletAddress}</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="hero">
        <div className="hero-eyebrow">Accredited Investors Only · Reg D 506(c)</div>
        <h1 className="hero-title">Investor Application</h1>
        <p className="hero-body">
          Apply for whitelisted access to STLLC tokenized deal notes and the ST Spread Collection.
          All investments are restricted to verified accredited investors under Regulation D.
        </p>
      </div>

      <div className="reg-banner" style={{ marginBottom: 24 }}>
        This application constitutes your self-certification as an accredited investor under
        Reg D Rule 506(c). STLLC may request additional documentation before whitelisting your wallet.
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Personal Info ── */}
        <div className="card">
          <div className="apply-section-title">Personal Information</div>

          <div className="apply-grid-2">
            <div className="apply-field">
              <label className="apply-label">Full Legal Name *</label>
              <input
                className="apply-input"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                placeholder="As it appears on government ID"
                required
              />
            </div>
            <div className="apply-field">
              <label className="apply-label">Email Address *</label>
              <input
                className="apply-input"
                type="email"
                name="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="apply-grid-2" style={{ marginTop: 16 }}>
            <div className="apply-field">
              <label className="apply-label">Phone Number</label>
              <input
                className="apply-input"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="apply-field">
              <label className="apply-label">Polygon Wallet Address *</label>
              <input
                className="apply-input apply-mono"
                type="text"
                name="walletAddress"
                value={form.walletAddress}
                onChange={e => set('walletAddress', e.target.value)}
                placeholder="0x…"
                required
              />
              {address && form.walletAddress === address && (
                <div className="apply-hint apply-hint--ok">✓ Auto-filled from connected wallet</div>
              )}
              {!address && (
                <div className="apply-hint">Connect your wallet above to auto-fill</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Investment Interest ── */}
        <div className="card">
          <div className="apply-section-title">Investment Interest</div>
          <div className="apply-section-sub">Select all asset types you are interested in (optional)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {INTERESTS.map(opt => (
              <label key={opt.value} className="apply-check-row">
                <input
                  type="checkbox"
                  className="apply-check"
                  checked={form.interests.includes(opt.value)}
                  onChange={() => toggleInterest(opt.value)}
                />
                <div>
                  <div className="apply-check-label">{opt.value}</div>
                  <div className="apply-check-desc">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Accreditation ── */}
        <div className="card">
          <div className="apply-section-title">Accredited Investor Certification *</div>
          <div className="apply-section-sub" style={{ marginBottom: 16 }}>
            Select the basis on which you qualify as an accredited investor under SEC Rule 501(a):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ACCREDITED_BASES.map(opt => (
              <label key={opt.value} className="apply-check-row">
                <input
                  type="radio"
                  className="apply-check"
                  name="accreditedBasis"
                  value={opt.value}
                  checked={form.accreditedBasis === opt.value}
                  onChange={() => set('accreditedBasis', opt.value)}
                />
                <div className="apply-check-label" style={{ fontWeight: 400 }}>{opt.label}</div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Attestation ── */}
        <div className="card">
          <div className="apply-section-title">Attestation & Electronic Signature</div>

          <label className="apply-check-row" style={{ marginBottom: 24, alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              className="apply-check"
              style={{ marginTop: 3, flexShrink: 0 }}
              checked={form.certify}
              onChange={e => set('certify', e.target.checked)}
              required
            />
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>
              I certify that I am an accredited investor as described above and that all information
              provided is true and accurate. I understand this offering is made exclusively under
              Regulation D Rule 506(c), that these securities have not been registered under the
              Securities Act of 1933, and that I may be required to provide documentation to verify
              my status. I acknowledge that private securities carry significant risk, including
              the potential for total loss of investment.
            </div>
          </label>

          <div className="apply-field">
            <label className="apply-label">Electronic Signature *</label>
            <div className="apply-section-sub" style={{ marginBottom: 8 }}>
              Type your full legal name exactly as entered above to sign electronically
            </div>
            <input
              className="apply-input apply-sig"
              type="text"
              value={form.signature}
              onChange={e => set('signature', e.target.value)}
              placeholder={form.fullName || 'Your full legal name'}
              required
            />
            {form.signature && form.fullName &&
              form.signature.trim().toLowerCase() !== form.fullName.trim().toLowerCase() && (
              <div className="apply-hint apply-hint--err">
                Signature must match full name exactly
              </div>
            )}
            {form.signature && form.fullName &&
              form.signature.trim().toLowerCase() === form.fullName.trim().toLowerCase() && (
              <div className="apply-hint apply-hint--ok">✓ Signature matches</div>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="apply-error">{errorMsg}</div>
        )}

        {/* ── Submit ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === 'submitting'}
            style={{ minWidth: 220, padding: '14px 32px', fontSize: 15 }}
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </form>
    </>
  )
}
