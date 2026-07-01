#!/usr/bin/env node
// Swap POL → USDC on Uniswap V3, fund ops wallet, deposit USDC into Aave V3.
// Dry-run by default. Pass --execute (or EXECUTE=1) to actually broadcast txs.
//
// Steps:
//   1. Quote POL→USDC on Uniswap V3 (0.05% pool)
//   2. Deployer swaps and sends USDC directly to ops wallet
//   3. Deployer sends 5 POL to ops wallet for gas
//   4. Ops wallet approves USDC and supplies to Aave V3 Pool

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ethers } = require('ethers');

const EXECUTE = process.argv.includes('--execute') || process.env.EXECUTE === '1';

// ─── Addresses (Polygon mainnet) ────────────────────────────────────────────
const ADDR = {
  WMATIC:        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  USDC:          '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // native (Circle) USDC
  UNISWAP_ROUTER:'0xE592427A0AEce92De3Edee1F18E0157C05861564', // SwapRouter
  UNISWAP_QUOTER:'0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // QuoterV2
  AAVE_POOL:     '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  AAVE_USDC_A:   '0xA4D94019934D8333Ef880ABFFbF2FDd611C762BD', // aPolUSDCn
};

// ─── Parameters ─────────────────────────────────────────────────────────────
const SWAP_POL_AMOUNT  = ethers.utils.parseEther('250');           // swap 250 POL
const OPS_POL_FUNDING  = ethers.utils.parseEther('5');             // 5 POL for gas
const POOL_FEE         = 500;                                      // 0.05% pool
const SLIPPAGE_BPS     = 100;                                      // 1.00% max slippage

// ─── ABIs ───────────────────────────────────────────────────────────────────
const ABI_ERC20 = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function deposit() payable',
];
const ABI_QUOTER = [
  'function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)',
];
const ABI_ROUTER = [
  'function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)',
];
const ABI_AAVE_POOL = [
  'function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)',
];

// ─── Setup ──────────────────────────────────────────────────────────────────
const provider   = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const deployer   = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
const opsWallet  = new ethers.Wallet(process.env.OPS_PRIVATE_KEY,      provider);

const fmt = (bn, dec = 18) => ethers.utils.formatUnits(bn, dec);

// Polygon requires min 25 gwei priority fee. Use 30 gwei to be safe.
async function gasOverrides() {
  const fd = await provider.getFeeData();
  const priority = ethers.utils.parseUnits('30', 'gwei');
  const base     = fd.lastBaseFeePerGas || fd.gasPrice;
  const maxFee   = base.mul(2).add(priority);
  return { maxPriorityFeePerGas: priority, maxFeePerGas: maxFee };
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  POL → USDC → Aave V3  Bootstrap');
  console.log('  Mode:', EXECUTE ? '🔴 LIVE EXECUTION' : '🟢 DRY-RUN (pass --execute to broadcast)');
  console.log('══════════════════════════════════════════════════════\n');

  console.log('Deployer :', deployer.address);
  console.log('Ops      :', opsWallet.address);

  // ─── Balances ─────────────────────────────────────────────────────────────
  const usdc = new ethers.Contract(ADDR.USDC, ABI_ERC20, provider);
  const aUsdc = new ethers.Contract(ADDR.AAVE_USDC_A, ABI_ERC20, provider);
  const dPol  = await provider.getBalance(deployer.address);
  const dUsdc = await usdc.balanceOf(deployer.address);
  const oPol  = await provider.getBalance(opsWallet.address);
  const oUsdc = await usdc.balanceOf(opsWallet.address);
  const oAUsdc = await aUsdc.balanceOf(opsWallet.address);

  console.log('\nBalances (before):');
  console.log('  Deployer:', fmt(dPol), 'POL  |', fmt(dUsdc, 6), 'USDC');
  console.log('  Ops     :', fmt(oPol), 'POL  |', fmt(oUsdc, 6), 'USDC  |', fmt(oAUsdc, 6), 'aUSDC');

  if (dPol.lt(SWAP_POL_AMOUNT.add(OPS_POL_FUNDING).add(ethers.utils.parseEther('1')))) {
    console.error('\n❌ Deployer POL too low for swap + ops funding + gas reserve.');
    process.exit(1);
  }

  // ─── Quote ────────────────────────────────────────────────────────────────
  const quoter = new ethers.Contract(ADDR.UNISWAP_QUOTER, ABI_QUOTER, provider);
  const quote = await quoter.callStatic.quoteExactInputSingle({
    tokenIn: ADDR.WMATIC,
    tokenOut: ADDR.USDC,
    amountIn: SWAP_POL_AMOUNT,
    fee: POOL_FEE,
    sqrtPriceLimitX96: 0,
  });
  const amountOutMin = quote.amountOut.mul(10000 - SLIPPAGE_BPS).div(10000);

  console.log('\nSwap quote:');
  console.log(`  Input    : ${fmt(SWAP_POL_AMOUNT)} POL`);
  console.log(`  Output   : ${fmt(quote.amountOut, 6)} USDC (expected)`);
  console.log(`  Min out  : ${fmt(amountOutMin, 6)} USDC (with ${SLIPPAGE_BPS/100}% slippage)`);
  console.log(`  Pool fee : ${POOL_FEE/10000}%`);
  console.log(`  Recipient: ${opsWallet.address}  (ops wallet)`);

  if (!EXECUTE) {
    console.log('\nDRY-RUN — no transactions broadcast. Re-run with --execute.\n');
    return;
  }

  // ─── 1. Wrap POL → WMATIC (deployer) ──────────────────────────────────────
  console.log('\n[1/4] Wrapping POL → WMATIC...');
  const wmatic = new ethers.Contract(ADDR.WMATIC, ABI_ERC20, deployer);
  const wrapTx = await wmatic.deposit({ value: SWAP_POL_AMOUNT, ...(await gasOverrides()) });
  console.log(`      tx: ${wrapTx.hash}`);
  await wrapTx.wait();
  console.log('      ✓ wrapped');

  // ─── 2. Approve router (deployer) ─────────────────────────────────────────
  console.log('\n[2/4] Approving WMATIC to Uniswap router...');
  const approveTx = await wmatic.approve(ADDR.UNISWAP_ROUTER, SWAP_POL_AMOUNT, await gasOverrides());
  console.log(`      tx: ${approveTx.hash}`);
  await approveTx.wait();
  console.log('      ✓ approved');

  // ─── 3. Swap WMATIC → USDC, recipient = ops (deployer) ────────────────────
  console.log('\n[3/4] Swapping WMATIC → USDC...');
  const router = new ethers.Contract(ADDR.UNISWAP_ROUTER, ABI_ROUTER, deployer);
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const swapTx = await router.exactInputSingle({
    tokenIn:           ADDR.WMATIC,
    tokenOut:          ADDR.USDC,
    fee:               POOL_FEE,
    recipient:         opsWallet.address,
    deadline,
    amountIn:          SWAP_POL_AMOUNT,
    amountOutMinimum:  amountOutMin,
    sqrtPriceLimitX96: 0,
  }, await gasOverrides());
  console.log(`      tx: ${swapTx.hash}`);
  const swapReceipt = await swapTx.wait();
  console.log('      ✓ swapped');

  // ─── 4. Fund ops with gas POL (deployer) ──────────────────────────────────
  console.log('\n[4/4] Funding ops wallet with POL for gas...');
  const fundTx = await deployer.sendTransaction({ to: opsWallet.address, value: OPS_POL_FUNDING, ...(await gasOverrides()) });
  console.log(`      tx: ${fundTx.hash}`);
  await fundTx.wait();
  console.log('      ✓ funded');

  // ─── 5. Aave deposit (ops) ────────────────────────────────────────────────
  const opsUsdcBal = await usdc.balanceOf(opsWallet.address);
  console.log(`\nOps now holds ${fmt(opsUsdcBal, 6)} USDC. Depositing to Aave V3...`);

  const usdcOps = usdc.connect(opsWallet);
  console.log('  → Approving USDC to Aave Pool...');
  const aaveApproveTx = await usdcOps.approve(ADDR.AAVE_POOL, opsUsdcBal, await gasOverrides());
  console.log(`    tx: ${aaveApproveTx.hash}`);
  await aaveApproveTx.wait();

  console.log('  → pool.supply()...');
  const pool = new ethers.Contract(ADDR.AAVE_POOL, ABI_AAVE_POOL, opsWallet);
  const supplyTx = await pool.supply(ADDR.USDC, opsUsdcBal, opsWallet.address, 0, await gasOverrides());
  console.log(`    tx: ${supplyTx.hash}`);
  await supplyTx.wait();
  console.log('  ✓ supplied');

  // ─── Final balances ───────────────────────────────────────────────────────
  const dPol2  = await provider.getBalance(deployer.address);
  const oPol2  = await provider.getBalance(opsWallet.address);
  const oUsdc2 = await usdc.balanceOf(opsWallet.address);
  const oAUsdc2 = await aUsdc.balanceOf(opsWallet.address);

  console.log('\nBalances (after):');
  console.log('  Deployer:', fmt(dPol2), 'POL');
  console.log('  Ops     :', fmt(oPol2), 'POL  |', fmt(oUsdc2, 6), 'USDC  |', fmt(oAUsdc2, 6), 'aUSDC');
  console.log('\n✓ Done. aUSDC will accrue yield in real-time (rebase per-block).\n');
}

main().catch((e) => { console.error('\n❌ ERROR:', e.message); process.exit(1); });
