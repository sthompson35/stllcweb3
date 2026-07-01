/**
 * save-token-svgs.js
 *
 * Generates SVG artwork for all 15 ST Spread Collection tokens
 * and saves them to scripts/token-images/ for preview and upload.
 *
 * Run:  node scripts/save-token-svgs.js
 */

const fs   = require('fs')
const path = require('path')

const OUT = path.join(__dirname, 'token-images')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

// ── Token data ────────────────────────────────────────────────────────────────

const DEAL_NOTES = [
  { id: 1, dealRef: 'ST-DEAL-009', face: 100,  repayment: 106, yieldPct: 6,  termMonths: 6,  arv: 195000 },
  { id: 2, dealRef: 'ST-DEAL-010', face: 100,  repayment: 107, yieldPct: 7,  termMonths: 9,  arv: 220000 },
  { id: 3, dealRef: 'ST-DEAL-011', face: 100,  repayment: 108, yieldPct: 8,  termMonths: 12, arv: 250000 },
  { id: 4, dealRef: 'ST-DEAL-012', face: 250,  repayment: 265, yieldPct: 6,  termMonths: 6,  arv: 350000 },
  { id: 5, dealRef: 'ST-DEAL-013', face: 500,  repayment: 530, yieldPct: 6,  termMonths: 6,  arv: 550000 },
]

const PRODUCTS = [
  { id: 6,  name: 'Desert Tan\nCombat Boot',   sku: 'KS-BOOT-001', priceUSD: 189.99 },
  { id: 7,  name: 'Multicam\nField Jacket',     sku: 'KS-JACK-001', priceUSD: 299.99 },
  { id: 8,  name: 'Operator\nPack Gen2',        sku: 'KS-PACK-002', priceUSD: 249.99 },
  { id: 9,  name: 'Brokerage\nTactical Vest',   sku: 'KS-VEST-001', priceUSD: 449.99 },
  { id: 10, name: "KhakiSol\nFounder's Watch",  sku: 'KS-WTCH-001', priceUSD: 799.99 },
]

const BADGES = [
  { id: 11, tier: 'Bronze',   shtxPerDay: 5,   color: '#cd7f32', glow: '#a0522d', text: '#fff8ee' },
  { id: 12, tier: 'Silver',   shtxPerDay: 15,  color: '#a8a9ad', glow: '#6e7074', text: '#ffffff' },
  { id: 13, tier: 'Gold',     shtxPerDay: 50,  color: '#d4af37', glow: '#a07d00', text: '#1a1000' },
  { id: 14, tier: 'Platinum', shtxPerDay: 150, color: '#e5e4e2', glow: '#8a9090', text: '#1a1a1a' },
  { id: 15, tier: 'Diamond',  shtxPerDay: 500, color: '#b9f2ff', glow: '#00b8d9', text: '#001a2e' },
]

// ── SVG generators ────────────────────────────────────────────────────────────

function svgDealNote({ id, dealRef, face, repayment, yieldPct, termMonths, arv }) {
  const profit = repayment - face
  const arvFmt = arv >= 1000 ? `$${(arv / 1000).toFixed(0)}K` : `$${arv}`
  const dots = []
  for (let x = 30; x < 570; x += 40) {
    for (let y = 30; y < 570; y += 40) {
      dots.push(`<circle cx="${x}" cy="${y}" r="1" fill="#1a3a5c" opacity="0.6"/>`)
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#040e1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#071e36;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00d4aa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0099cc;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="clip"><rect width="600" height="600" rx="24"/></clipPath>
  </defs>
  <rect width="600" height="600" rx="24" fill="url(#bg)"/>
  <g clip-path="url(#clip)">
  ${dots.join('\n  ')}
  <rect x="0" y="0" width="600" height="6" fill="url(#accent)"/>
  <polyline points="0,80 40,80 40,40 80,40" fill="none" stroke="#00d4aa" stroke-width="1.5" opacity="0.4"/>
  <polyline points="600,80 560,80 560,40 520,40" fill="none" stroke="#00d4aa" stroke-width="1.5" opacity="0.4"/>
  <polyline points="0,520 40,520 40,560 80,560" fill="none" stroke="#00d4aa" stroke-width="1.5" opacity="0.4"/>
  <polyline points="600,520 560,520 560,560 520,560" fill="none" stroke="#00d4aa" stroke-width="1.5" opacity="0.4"/>
  <text x="300" y="80" font-family="'Courier New',monospace" font-size="11" fill="#00d4aa" opacity="0.7" text-anchor="middle" letter-spacing="6">STLLC INVESTMENT PORTAL</text>
  <rect x="60" y="95" width="480" height="1" fill="#00d4aa" opacity="0.2"/>
  <text x="300" y="145" font-family="Arial Black,sans-serif" font-size="38" fill="#ffffff" text-anchor="middle" font-weight="900" letter-spacing="4">DEAL NOTE</text>
  <text x="300" y="172" font-family="'Courier New',monospace" font-size="13" fill="#00d4aa" text-anchor="middle" letter-spacing="3">${dealRef}</text>
  <rect x="258" y="182" width="84" height="22" rx="11" fill="#00d4aa" opacity="0.15"/>
  <text x="300" y="197" font-family="'Courier New',monospace" font-size="11" fill="#00d4aa" text-anchor="middle" letter-spacing="2">TOKEN #${String(id).padStart(3,'0')}</text>
  <rect x="60" y="215" width="480" height="1.5" fill="url(#accent)" opacity="0.5"/>
  <text x="300" y="290" font-family="Arial Black,sans-serif" font-size="96" fill="url(#accent)" text-anchor="middle" font-weight="900" filter="url(#glow)">${yieldPct}%</text>
  <text x="300" y="318" font-family="Arial,sans-serif" font-size="14" fill="#7ab8cc" text-anchor="middle" letter-spacing="4">ANNUALIZED YIELD</text>
  <rect x="60" y="340" width="480" height="1" fill="#1a3a5c"/>
  <rect x="60" y="355" width="150" height="70" rx="8" fill="#0a1e30"/>
  <text x="135" y="380" font-family="Arial,sans-serif" font-size="10" fill="#7ab8cc" text-anchor="middle" letter-spacing="2">FACE VALUE</text>
  <text x="135" y="408" font-family="Arial Black,sans-serif" font-size="22" fill="#ffffff" text-anchor="middle">$${face}</text>
  <rect x="225" y="355" width="150" height="70" rx="8" fill="#0a1e30"/>
  <text x="300" y="380" font-family="Arial,sans-serif" font-size="10" fill="#7ab8cc" text-anchor="middle" letter-spacing="2">RETURN</text>
  <text x="300" y="408" font-family="Arial Black,sans-serif" font-size="22" fill="#00d4aa" text-anchor="middle">$${repayment}</text>
  <rect x="390" y="355" width="150" height="70" rx="8" fill="#0a1e30"/>
  <text x="465" y="380" font-family="Arial,sans-serif" font-size="10" fill="#7ab8cc" text-anchor="middle" letter-spacing="2">PROFIT</text>
  <text x="465" y="408" font-family="Arial Black,sans-serif" font-size="22" fill="#00ff88" text-anchor="middle">+$${profit}</text>
  <rect x="60" y="438" width="225" height="55" rx="8" fill="#071525"/>
  <text x="172" y="460" font-family="Arial,sans-serif" font-size="10" fill="#7ab8cc" text-anchor="middle" letter-spacing="2">TERM</text>
  <text x="172" y="483" font-family="Arial Black,sans-serif" font-size="20" fill="#ffffff" text-anchor="middle">${termMonths} MONTHS</text>
  <rect x="315" y="438" width="225" height="55" rx="8" fill="#071525"/>
  <text x="427" y="460" font-family="Arial,sans-serif" font-size="10" fill="#7ab8cc" text-anchor="middle" letter-spacing="2">EST. PROPERTY ARV</text>
  <text x="427" y="483" font-family="Arial Black,sans-serif" font-size="20" fill="#ffffff" text-anchor="middle">${arvFmt}</text>
  <rect x="60" y="510" width="480" height="1" fill="#1a3a5c"/>
  <text x="300" y="535" font-family="'Courier New',monospace" font-size="10" fill="#3a6a8a" text-anchor="middle">Reg D 506(c) · Accredited Investors Only · Polygon Mainnet</text>
  <text x="300" y="555" font-family="'Courier New',monospace" font-size="9" fill="#2a4a6a" text-anchor="middle">0x364621d5b4f77feF957708F0A35cB674A8bf19a9</text>
  <rect x="0" y="594" width="600" height="6" fill="url(#accent)"/>
  </g>
</svg>`
}

function svgProduct({ id, name, sku, priceUSD }) {
  const nameParts = name.split('\n')
  const line1 = nameParts[0], line2 = nameParts[1] || ''
  const hexes = []
  const hexColors = ['#2d3a1e','#3d4a28','#4a5a32','#3a4820','#2a3018','#384530']
  let row = 0
  for (let y = 0; y < 620; y += 36) {
    let col = 0
    for (let x = row % 2 === 0 ? 0 : 21; x < 620; x += 42) {
      hexes.push(`<polygon points="${x},${y} ${x+21},${y-12} ${x+42},${y} ${x+42},${y+24} ${x+21},${y+36} ${x},${y+24}" fill="${hexColors[(row+col)%hexColors.length]}" opacity="0.5"/>`)
      col++
    }
    row++
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bgp" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1e10;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d3518;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="khaki" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c9b06e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e8d090;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.6"/>
    </filter>
    <clipPath id="clipP"><rect width="600" height="600" rx="24"/></clipPath>
  </defs>
  <rect width="600" height="600" rx="24" fill="url(#bgp)"/>
  <g clip-path="url(#clipP)">
  ${hexes.join('\n  ')}
  <rect width="600" height="600" fill="#1a1e10" opacity="0.55"/>
  <rect x="0" y="0" width="600" height="5" fill="url(#khaki)"/>
  <text x="300" y="68" font-family="Arial Black,sans-serif" font-size="36" fill="url(#khaki)" text-anchor="middle" font-weight="900" letter-spacing="10" filter="url(#shadow)">KHAKISOL</text>
  <text x="300" y="92" font-family="'Courier New',monospace" font-size="10" fill="#8a7a50" text-anchor="middle" letter-spacing="5">TACTICAL · AUTHENTIC · EARNED</text>
  <line x1="60" y1="108" x2="248" y2="108" stroke="#c9b06e" stroke-width="1" opacity="0.4"/>
  <rect x="252" y="100" width="96" height="16" rx="3" fill="#c9b06e" opacity="0.15"/>
  <text x="300" y="112" font-family="'Courier New',monospace" font-size="9" fill="#c9b06e" text-anchor="middle" letter-spacing="2">PRODUCT NFT</text>
  <line x1="352" y1="108" x2="540" y2="108" stroke="#c9b06e" stroke-width="1" opacity="0.4"/>
  <text x="300" y="145" font-family="'Courier New',monospace" font-size="11" fill="#6a5a30" text-anchor="middle" letter-spacing="3">TOKEN #${String(id).padStart(3,'0')} · ${sku}</text>
  <rect x="100" y="165" width="400" height="240" rx="16" fill="#0d1208" opacity="0.7"/>
  <rect x="100" y="165" width="400" height="240" rx="16" fill="none" stroke="#c9b06e" stroke-width="1.5" opacity="0.3"/>
  <circle cx="300" cy="285" r="80" fill="none" stroke="#c9b06e" stroke-width="1" opacity="0.15"/>
  <circle cx="300" cy="285" r="50" fill="none" stroke="#c9b06e" stroke-width="1" opacity="0.2"/>
  <line x1="220" y1="285" x2="380" y2="285" stroke="#c9b06e" stroke-width="1" opacity="0.2"/>
  <line x1="300" y1="205" x2="300" y2="365" stroke="#c9b06e" stroke-width="1" opacity="0.2"/>
  <text x="300" y="${line2 ? 268 : 285}" font-family="Arial Black,sans-serif" font-size="${line2 ? 28 : 32}" fill="#ffffff" text-anchor="middle" font-weight="900">${line1}</text>
  ${line2 ? `<text x="300" y="305" font-family="Arial Black,sans-serif" font-size="28" fill="#ffffff" text-anchor="middle" font-weight="900">${line2}</text>` : ''}
  <rect x="190" y="420" width="220" height="60" rx="12" fill="#c9b06e" opacity="0.12"/>
  <rect x="190" y="420" width="220" height="60" rx="12" fill="none" stroke="#c9b06e" stroke-width="1.5" opacity="0.5"/>
  <text x="300" y="444" font-family="Arial,sans-serif" font-size="10" fill="#8a7a50" text-anchor="middle" letter-spacing="3">REDEEMABLE VALUE</text>
  <text x="300" y="472" font-family="Arial Black,sans-serif" font-size="28" fill="url(#khaki)" text-anchor="middle" font-weight="900">$${priceUSD.toFixed(2)}</text>
  <rect x="60" y="498" width="225" height="50" rx="8" fill="#0d1208" opacity="0.6"/>
  <text x="172" y="519" font-family="Arial,sans-serif" font-size="9" fill="#6a5a30" text-anchor="middle" letter-spacing="2">BLOCKCHAIN</text>
  <text x="172" y="539" font-family="Arial Black,sans-serif" font-size="16" fill="#c9b06e" text-anchor="middle">POLYGON</text>
  <rect x="315" y="498" width="225" height="50" rx="8" fill="#0d1208" opacity="0.6"/>
  <text x="427" y="519" font-family="Arial,sans-serif" font-size="9" fill="#6a5a30" text-anchor="middle" letter-spacing="2">SKU</text>
  <text x="427" y="539" font-family="'Courier New',monospace" font-size="14" fill="#c9b06e" text-anchor="middle">${sku}</text>
  <rect x="0" y="595" width="600" height="5" fill="url(#khaki)"/>
  </g>
</svg>`
}

function svgBadge({ id, tier, shtxPerDay, color, glow }) {
  const R = 160, cx = 300, cy = 275
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  const hexInner = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${(cx + (R-12) * Math.cos(a)).toFixed(1)},${(cy + (R-12) * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  const sparkles = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI / 180) * (30 * i)
    const r = R + 28
    return `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="${i%3===0?3:1.5}" fill="${color}" opacity="${i%3===0?0.8:0.4}"/>`
  })
  const stars = Array.from({length: 40}, (_, i) => {
    const x = ((i * 137.5) % 600).toFixed(0)
    const y = ((i * 97.3 + 50) % 560).toFixed(0)
    return `<circle cx="${x}" cy="${y}" r="${(0.5+(i%3)*0.5).toFixed(1)}" fill="#ffffff" opacity="${(0.1+(i%4)*0.08).toFixed(2)}"/>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <radialGradient id="bgBadge" cx="50%" cy="45%" r="60%">
      <stop offset="0%" style="stop-color:#0a0a12;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#020208;stop-opacity:1" />
    </radialGradient>
    <radialGradient id="hexFill" cx="50%" cy="40%" r="60%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.35" />
      <stop offset="100%" style="stop-color:${glow};stop-opacity:0.15" />
    </radialGradient>
    <filter id="hexGlow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="clipB"><rect width="600" height="600" rx="24"/></clipPath>
  </defs>
  <rect width="600" height="600" rx="24" fill="url(#bgBadge)"/>
  <g clip-path="url(#clipB)">
  <circle cx="300" cy="275" r="220" fill="${color}" opacity="0.04"/>
  <circle cx="300" cy="275" r="140" fill="${color}" opacity="0.06"/>
  ${stars.join('\n  ')}
  ${sparkles.join('\n  ')}
  <polygon points="${hexPoints}" fill="${color}" opacity="0.08" filter="url(#hexGlow)"/>
  <polygon points="${hexPoints}" fill="url(#hexFill)" stroke="${color}" stroke-width="3" opacity="0.9"/>
  <polygon points="${hexInner}" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>
  <text x="300" y="190" font-family="Arial Black,sans-serif" font-size="18" fill="${color}" text-anchor="middle" font-weight="900" letter-spacing="10" filter="url(#textGlow)">SPREAD</text>
  <line x1="220" y1="200" x2="380" y2="200" stroke="${color}" stroke-width="1" opacity="0.5"/>
  <text x="300" y="268" font-family="Arial Black,sans-serif" font-size="52" fill="${color}" text-anchor="middle" font-weight="900" letter-spacing="2" filter="url(#textGlow)">${tier.toUpperCase()}</text>
  <text x="300" y="300" font-family="Arial,sans-serif" font-size="14" fill="${color}" text-anchor="middle" opacity="0.6">&#9670;&#9670;&#9670;</text>
  <text x="300" y="338" font-family="'Courier New',monospace" font-size="13" fill="${color}" text-anchor="middle" opacity="0.85" letter-spacing="1">${shtxPerDay} SHTX / DAY</text>
  <text x="300" y="362" font-family="'Courier New',monospace" font-size="10" fill="${color}" text-anchor="middle" opacity="0.5">TOKEN #${String(id).padStart(3,'0')}</text>
  <text x="300" y="475" font-family="Arial Black,sans-serif" font-size="22" fill="#ffffff" text-anchor="middle" font-weight="900" opacity="0.9" letter-spacing="6">STLLC</text>
  <text x="300" y="498" font-family="Arial,sans-serif" font-size="11" fill="#555577" text-anchor="middle" letter-spacing="3">INVESTOR BADGE</text>
  <rect x="90" y="518" width="180" height="32" rx="16" fill="${color}" opacity="0.12"/>
  <rect x="90" y="518" width="180" height="32" rx="16" fill="none" stroke="${color}" stroke-width="1" opacity="0.3"/>
  <text x="180" y="539" font-family="'Courier New',monospace" font-size="10" fill="${color}" text-anchor="middle">POLYGON</text>
  <rect x="330" y="518" width="180" height="32" rx="16" fill="${color}" opacity="0.12"/>
  <rect x="330" y="518" width="180" height="32" rx="16" fill="none" stroke="${color}" stroke-width="1" opacity="0.3"/>
  <text x="420" y="539" font-family="'Courier New',monospace" font-size="10" fill="${color}" text-anchor="middle">ERC-1155</text>
  <rect x="0" y="575" width="600" height="2" fill="${color}" opacity="0.3"/>
  </g>
</svg>`
}

// ── Generate and save ─────────────────────────────────────────────────────────

const tasks = [
  ...DEAL_NOTES.map(t => ({ id: t.id, file: `${t.id}-deal-note.svg`,    svg: svgDealNote(t) })),
  ...PRODUCTS.map(t  => ({ id: t.id, file: `${t.id}-product.svg`,       svg: svgProduct(t)  })),
  ...BADGES.map(t    => ({ id: t.id, file: `${t.id}-badge-${t.tier.toLowerCase()}.svg`, svg: svgBadge(t) })),
]

for (const { id, file, svg } of tasks) {
  const dest = path.join(OUT, file)
  fs.writeFileSync(dest, svg)
  console.log(`✓ Token ${String(id).padStart(2)}  →  token-images/${file}`)
}

console.log(`\n${tasks.length} SVGs saved to:  scripts/token-images/`)
console.log('\nTo upload to Sequence, run:')
console.log('  node scripts/upload-token-images.js  (needs Secret API key)')
