import { ReactNode } from 'react'
import WalletButton from './WalletButton'

type Page = 'dashboard' | 'spread' | 'portfolio' | 'admin' | 'apply'

interface LayoutProps {
  page: Page
  setPage: (p: Page) => void
  children: ReactNode
}

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Overview',
  spread:    'Spread Collection',
  portfolio: 'My Portfolio',
  admin:     'Admin Dashboard',
  apply:     'Investor Application',
}

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Overview',          icon: '◈' },
  { id: 'spread',    label: 'Spread Collection',  icon: '◆' },
  { id: 'portfolio', label: 'My Portfolio',       icon: '◉' },
  { id: 'apply',     label: 'Apply to Invest',   icon: '✦' },
]

const ADMIN_NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'admin', label: 'Admin Dashboard', icon: '⚙' },
]

export default function Layout({ page, setPage, children }: LayoutProps) {
  return (
    <div className="shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">ST<span>LLC</span></div>
          <div className="sidebar-sub">Investment Portal</div>
          <div className="net-badge">Polygon Mainnet</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Investor</div>
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-link ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div className="nav-section" style={{ marginTop: 24 }}>Admin</div>
          {ADMIN_NAV.map(n => (
            <button
              key={n.id}
              className={`nav-link ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div className="nav-section" style={{ marginTop: 24 }}>Resources</div>
          <a
            className="nav-link"
            href="https://sequence.build/project/48396/contracts"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span style={{ fontSize: 14 }}>⬡</span>
            Sequence Builder
          </a>
        </nav>

        <div className="sidebar-footer">
          <WalletButton />
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main">
        <header className="topbar">
          <span className="topbar-title">{PAGE_TITLES[page]}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--steel)' }}>
              Reg D 506(c) · Accredited Investors Only
            </span>
            <WalletButton />
          </div>
        </header>
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}
