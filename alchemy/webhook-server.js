// Alchemy Webhook Receiver — stllcweb3
// Receives and verifies Alchemy Notify events (address activity, NFT transfers, mined txs)
// Usage: node webhook-server.js
//        Then expose with: ngrok http 4040

require('dotenv').config({ path: '../.env' });
const express = require('express');
const crypto  = require('crypto');
const cors    = require('cors');

// @coinbase/cdp-sdk depends on ESM-only `jose`; load lazily via dynamic import.
let _getAuthHeaders = null;
async function getAuthHeaders(...args) {
  if (!_getAuthHeaders) {
    const mod = await import('@coinbase/cdp-sdk/auth');
    _getAuthHeaders = mod.getAuthHeaders;
  }
  return _getAuthHeaders(...args);
}

const PORT         = process.env.WEBHOOK_PORT || 4040;
const SIGNING_KEYS = (process.env.ALCHEMY_WEBHOOK_SIGNING_KEY || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const IS_PROD      = process.env.NODE_ENV === 'production';

if (SIGNING_KEYS.length === 0 && IS_PROD) {
  console.error('[webhook] FATAL: ALCHEMY_WEBHOOK_SIGNING_KEY must be set in production');
  process.exit(1);
}

const app = express();

// CORS for the Vite dev server (and any localhost port)
app.use(cors({ origin: /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.|172\.):\d+$/ }));

// Raw body needed for HMAC signature verification
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));

// ── Signature verification ─────────────────────────────────────────────────
function verifySignature(req) {
  if (SIGNING_KEYS.length === 0) return true; // skip in local dev only (prod blocked above)
  const sig = req.headers['x-alchemy-signature'];
  if (!sig) return false;
  return SIGNING_KEYS.some(key => {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(req.rawBody);
    return hmac.digest('hex') === sig;
  });
}

// ── Webhook endpoint ───────────────────────────────────────────────────────
app.post('/webhook', (req, res) => {
  if (!verifySignature(req)) {
    console.warn('[webhook] Invalid signature — rejected');
    return res.status(401).send('Unauthorized');
  }

  const { type, event } = req.body;
  console.log(`\n[webhook] ${new Date().toISOString()} — type: ${type}`);

  switch (type) {
    case 'ADDRESS_ACTIVITY': {
      const acts = event?.activity || [];
      for (const a of acts) {
        console.log(`  [activity] ${a.fromAddress} → ${a.toAddress}  ${a.value} ${a.asset}  tx: ${a.hash}`);
      }
      break;
    }
    case 'NFT_ACTIVITY': {
      const transfers = event?.nftActivity || [];
      for (const t of transfers) {
        console.log(`  [nft] #${t.tokenId} ${t.fromAddress} → ${t.toAddress}  contract: ${t.contractAddress}`);
      }
      break;
    }
    case 'MINED_TRANSACTION': {
      const tx = event?.transaction;
      console.log(`  [mined] ${tx?.hash}  block: ${tx?.blockNum}`);
      break;
    }
    case 'DROPPED_TRANSACTION': {
      const tx = event?.transaction;
      console.log(`  [dropped] ${tx?.hash}`);
      break;
    }
    default:
      console.log('  [unknown type]', JSON.stringify(req.body).slice(0, 200));
  }

  res.sendStatus(200);
});

// ── Coinbase Onramp session endpoint ──────────────────────────────────────
// Mints a single-use onramp URL via Coinbase CDP. As of 2025-07-31, Onramp
// requires a server-minted session — bare appId URLs no longer work.
//
// Body:    { address: "0x...", purchaseCurrency?: "USDC", destinationNetwork?: "polygon",
//            paymentAmount?: "100", paymentCurrency?: "USD" }
// Returns: { onrampUrl } or { error, configured: false }
const CDP_API_KEY_ID     = process.env.CDP_API_KEY_ID || '';
// Normalize PEM keys: dotenv may leave literal "\n" if value wasn't double-quoted.
// Also convert SEC1 EC keys (BEGIN EC PRIVATE KEY) to PKCS8, which is what jose expects.
function normalizeCdpSecret(raw) {
  if (!raw) return '';
  let s = raw.replace(/\\n/g, '\n');
  if (s.includes('BEGIN EC PRIVATE KEY')) {
    try {
      const keyObj = crypto.createPrivateKey({ key: s, format: 'pem' });
      s = keyObj.export({ format: 'pem', type: 'pkcs8' }).toString();
    } catch (e) {
      console.warn('[onramp] SEC1→PKCS8 conversion failed:', e.message);
    }
  }
  return s;
}
const CDP_API_KEY_SECRET = normalizeCdpSecret(process.env.CDP_API_KEY_SECRET);
const CDP_CONFIGURED     = Boolean(CDP_API_KEY_ID && CDP_API_KEY_SECRET);
const CDP_HOST           = 'api.cdp.coinbase.com';
const CDP_PATH           = '/platform/v2/onramp/sessions';

app.post('/api/onramp/session-token', async (req, res) => {
  if (!CDP_CONFIGURED) {
    return res.status(503).json({
      error: 'Coinbase CDP credentials not configured',
      configured: false,
      hint: 'Set CDP_API_KEY_ID and CDP_API_KEY_SECRET in .env',
    });
  }
  const {
    address,
    purchaseCurrency   = 'USDC',
    destinationNetwork = 'polygon',
    paymentAmount,
    paymentCurrency    = 'USD',
  } = req.body || {};
  if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) {
    return res.status(400).json({ error: 'invalid address' });
  }

  try {
    const body = {
      destinationAddress: address,
      purchaseCurrency,
      destinationNetwork,
      ...(paymentAmount   ? { paymentAmount: String(paymentAmount) } : {}),
      ...(paymentCurrency ? { paymentCurrency } : {}),
    };

    const headers = await getAuthHeaders({
      apiKeyId:     CDP_API_KEY_ID,
      apiKeySecret: CDP_API_KEY_SECRET,
      requestMethod:'POST',
      requestHost:  CDP_HOST,
      requestPath:  CDP_PATH,
      requestBody:  body,
    });

    const r = await fetch(`https://${CDP_HOST}${CDP_PATH}`, {
      method:  'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) {
      console.warn('[onramp] CDP error', r.status, data);
      return res.status(r.status).json({ error: data?.errorMessage || data?.message || 'CDP API error', details: data });
    }
    return res.json({ onrampUrl: data?.session?.onrampUrl, quote: data?.quote });
  } catch (e) {
    console.error('[onramp] exception', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  network: 'polygon-mainnet',
  onramp: CDP_CONFIGURED ? 'configured' : 'unconfigured',
}));

app.listen(PORT, () => {
  console.log(`Webhook server listening on http://localhost:${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/webhook`);
  if (SIGNING_KEYS.length === 0) console.warn('  [WARN] ALCHEMY_WEBHOOK_SIGNING_KEY not set — signature verification disabled (dev mode only)');
  else console.log(`  Signature verification: enabled (${SIGNING_KEYS.length} key${SIGNING_KEYS.length > 1 ? 's' : ''})`);
  console.log(`  Onramp:                 ${CDP_CONFIGURED ? 'configured' : 'unconfigured (set CDP_* in .env)'}`);
  console.log(`  Onramp endpoint:        POST http://localhost:${PORT}/api/onramp/session-token`);
});
