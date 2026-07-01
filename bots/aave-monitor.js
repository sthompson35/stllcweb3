#!/usr/bin/env node
// Aave V3 USDC supply monitor for the ops wallet.
// Polls aUSDC balance, tracks yield accrued, displays current Aave supply APR.
//
// Usage:
//   node bots/aave-monitor.js           # watch mode, 60s interval
//   node bots/aave-monitor.js --once    # single status check, then exit
//   INTERVAL=30 node bots/aave-monitor.js   # 30s polling interval

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ethers } = require('ethers');
const fs   = require('fs');
const path = require('path');

const ONCE     = process.argv.includes('--once');
const INTERVAL = Number(process.env.INTERVAL || 60) * 1000;

const ADDR = {
  USDC:        '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  AAVE_POOL:   '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  AAVE_USDC_A: '0xA4D94019934D8333Ef880ABFFbF2FDd611C762BD',
};

const ABI_ERC20 = ['function balanceOf(address) view returns (uint256)'];
const ABI_AAVE_POOL = [
  // V3 ReserveData struct (selector-compatible signature; only liquidityRate matters here)
  'function getReserveData(address asset) view returns (' +
    '(uint256 data) configuration,' +
    'uint128 liquidityIndex,' +
    'uint128 currentLiquidityRate,' +
    'uint128 variableBorrowIndex,' +
    'uint128 currentVariableBorrowRate,' +
    'uint128 currentStableBorrowRate,' +
    'uint40 lastUpdateTimestamp,' +
    'uint16 id,' +
    'address aTokenAddress,' +
    'address stableDebtTokenAddress,' +
    'address variableDebtTokenAddress,' +
    'address interestRateStrategyAddress,' +
    'uint128 accruedToTreasury,' +
    'uint128 unbacked,' +
    'uint128 isolationModeTotalDebt' +
  ')',
];

const RAY = ethers.BigNumber.from(10).pow(27);
const SECONDS_PER_YEAR = 31_536_000;

const STATE_FILE = path.join(__dirname, 'aave-monitor.state.json');

const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const ops      = process.env.OPS_WALLET || new ethers.Wallet(process.env.OPS_PRIVATE_KEY).address;

const aToken = new ethers.Contract(ADDR.AAVE_USDC_A, ABI_ERC20,     provider);
const pool   = new ethers.Contract(ADDR.AAVE_POOL,   ABI_AAVE_POOL, provider);

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return null; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

function fmtUSDC(bn)  { return Number(ethers.utils.formatUnits(bn, 6)).toFixed(6); }
function fmtDelta(bn) { const n = Number(ethers.utils.formatUnits(bn, 6)); return (n >= 0 ? '+' : '') + n.toFixed(6); }
function fmtPct(num, den) {
  if (den.isZero()) return '   -   ';
  const pct = Number(num.mul(1_000_000).div(den)) / 10_000; // 4 dp
  return (pct >= 0 ? '+' : '') + pct.toFixed(4) + '%';
}

async function snapshot() {
  const [bal, reserve] = await Promise.all([
    aToken.balanceOf(ops),
    pool.getReserveData(ADDR.USDC),
  ]);
  // currentLiquidityRate is in ray (1e27), expressed as APR per second × SECONDS_PER_YEAR (Aave convention)
  // Supply APY = ((1 + APR / SECONDS_PER_YEAR) ^ SECONDS_PER_YEAR - 1)
  // Approximation: APY ≈ APR when APR is small (<10%)
  const apr = Number(reserve.currentLiquidityRate.toString()) / Number(RAY.toString()) * 100;
  return { ts: Date.now(), balance: bal, supplyApr: apr };
}

async function tick() {
  const now = await snapshot();
  const prev = loadState();
  const start = prev?.start || { ts: now.ts, balance: now.balance.toString() };
  const startBal = ethers.BigNumber.from(start.balance);
  const lastBal  = prev ? ethers.BigNumber.from(prev.last.balance) : now.balance;

  const dSinceStart = now.balance.sub(startBal);
  const dSinceLast  = now.balance.sub(lastBal);
  const elapsedSec  = (now.ts - start.ts) / 1000;

  // Annualized realized APY from observed accrual (simple, no compounding)
  let realizedApy = '   -   ';
  if (elapsedSec > 30 && !startBal.isZero()) {
    const yearlyNum = dSinceStart.mul(SECONDS_PER_YEAR).mul(10_000);
    const pct = Number(yearlyNum.div(startBal).toString()) / Math.max(elapsedSec, 1) / 100;
    realizedApy = pct.toFixed(4) + '%';
  }

  const ts = new Date(now.ts).toISOString().slice(0, 19) + 'Z';
  console.log(
    `[${ts}] aUSDC: ${fmtUSDC(now.balance)}` +
    ` | Δstart: ${fmtDelta(dSinceStart)} (${fmtPct(dSinceStart, startBal)})` +
    ` | Δtick: ${fmtDelta(dSinceLast)}` +
    ` | Aave APR: ${now.supplyApr.toFixed(2)}%` +
    ` | Realized APY: ${realizedApy}` +
    ` | uptime: ${Math.floor(elapsedSec)}s`
  );

  saveState({
    start,
    last: { ts: now.ts, balance: now.balance.toString() },
    supplyApr: now.supplyApr,
  });
}

(async () => {
  console.log(`Aave V3 monitor — ops wallet ${ops}`);
  console.log(`Polling every ${INTERVAL/1000}s. State: ${STATE_FILE}`);
  console.log(''.padEnd(96, '─'));

  await tick();
  if (ONCE) return;
  setInterval(() => { tick().catch(e => console.error('tick error:', e.message)); }, INTERVAL);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
