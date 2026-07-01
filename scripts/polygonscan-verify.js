/**
 * Direct PolygonScan source verification via Etherscan-compatible API.
 * Reads Hardhat build-info, extracts standard-json-input, submits per contract.
 *
 * Usage: node scripts/polygonscan-verify.js
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");
const { URLSearchParams } = require("url");
require("dotenv").config();

const API_KEY     = process.env.POLYGONSCAN_API_KEY;
const CHAIN_ID    = "137";
const BUILD_DIR   = path.join(__dirname, "../artifacts/build-info");

// ─── Contracts to verify ──────────────────────────────────────────────────────
const CONTRACTS = [
  {
    address:      "0xD37C155Ec17D48fFeC60408D55e2b42121135CEE",
    contractFile: "contracts/core/STLLCEquityToken.sol",
    contractName: "STLLCEquityToken",
    constructorArgs: "",
    label: "STLLCEquityToken (implementation)",
  },
  {
    address:      "0xeF3177D3C908432f8a5BbEA012245Ee5B439Cbd4",
    contractFile: "contracts/core/STDealNote.sol",
    contractName: "STDealNote",
    constructorArgs: encodeDealNoteArgs(),
    label: "STDealNote (ST-DEAL-008)",
  },
  {
    address:      "0xb015236Ffc5Cc3E7a2249526e2664171B36Bd844",
    contractFile: "contracts/core/SHTXUtilityToken.sol",
    contractName: "SHTXUtilityToken",
    constructorArgs: encodeAddress("0x5B72B41e94fFFD19a053b739e39A305fe2374cDE"),
    label: "SHTXUtilityToken",
  },
  {
    address:      "0x0fBBFB730d981Af5a01Df2F080f8a576A45ef90d",
    contractFile: "contracts/core/STDealTrackRecord.sol",
    contractName: "STDealTrackRecord",
    constructorArgs: encodeAddress("0x5B72B41e94fFFD19a053b739e39A305fe2374cDE"),
    label: "STDealTrackRecord (Soulbound)",
  },
  {
    address:      "0xB2FDE2B62BB20286Da67eb99CF0068263de4Fb21",
    contractFile: "contracts/core/KhakiSolLoyalty.sol",
    contractName: "KhakiSolLoyalty",
    constructorArgs: encodeAddressAndString(
      "0x5B72B41e94fFFD19a053b739e39A305fe2374cDE",
      "https://api.khakisol.com/metadata/{id}.json"
    ),
    label: "KhakiSolLoyalty (ERC-1155)",
  },
  {
    address:      "0x364621d5b4f77feF957708F0A35cB674A8bf19a9",
    contractFile: "contracts/core/STSpreadCollection.sol",
    contractName: "STSpreadCollection",
    constructorArgs: encodeAddressAddressString(
      "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      "0x5B72B41e94fFFD19a053b739e39A305fe2374cDE",
      "https://api.stllc.com/spread-collection/metadata/{id}.json"
    ),
    label: "STSpreadCollection (15-token ERC-1155)",
  },
];

// ─── ABI encoding helpers (minimal — no ethers dependency needed) ─────────────

function pad32(hex) {
  return hex.replace(/^0x/, "").padStart(64, "0");
}

function encodeAddress(addr) {
  return pad32(addr);
}

function encodeString(str) {
  const buf = Buffer.from(str, "utf8");
  const len = pad32(buf.length.toString(16));
  const chunks = Math.ceil(buf.length / 32);
  let data = "";
  for (let i = 0; i < chunks; i++) {
    const slice = buf.slice(i * 32, (i + 1) * 32);
    data += slice.toString("hex").padEnd(64, "0");
  }
  return len + data;
}

function encodeAddressAndString(addr, str) {
  // tuple: (address, string)
  // offset to address = 0x00 (immediate), offset to string = 0x40
  const addrEncoded   = pad32(addr);
  const strOffset     = pad32("40"); // 64 bytes in
  const strEncoded    = encodeString(str);
  return addrEncoded + strOffset + strEncoded;
}

function encodeAddressAddressString(addr1, addr2, str) {
  // tuple: (address, address, string)
  // address1 at 0x00, address2 at 0x20, string offset at 0x40, string data at 0x60
  const a1       = pad32(addr1);
  const a2       = pad32(addr2);
  const strOff   = pad32("60"); // 96 bytes in
  const strData  = encodeString(str);
  return a1 + a2 + strOff + strData;
}

function encodeDealNoteArgs() {
  // constructor(address usdc, address manager, uint256 totalTokens,
  //   uint256 faceValue, uint256 repayment, uint256 maturityDate,
  //   string dealRef, string propertyAddress, uint256 arvUSD)
  // Dynamic types (strings): offsets needed
  // Static layout: usdc(32) manager(32) totalTokens(32) faceValue(32) repayment(32) maturity(32) offset_dealRef(32) offset_propAddr(32) arvUSD(32)
  // = 9 static slots = 288 bytes = 0x120 before dynamic data
  const usdc        = pad32("3c499c542cEF5E3811e1192ce70d8cC03d5c3359");
  const manager     = pad32("5B72B41e94fFFD19a053b739e39A305fe2374cDE");
  const totalTokens = pad32(Number(1290).toString(16));
  const faceValue   = pad32(Number(100000000).toString(16));
  const repayment   = pad32(Number(106000000).toString(16));
  const maturity    = pad32(Number(1794527595).toString(16));
  const arvUSD      = pad32(Number(19500000).toString(16));

  // 9 static slots = 9 * 32 = 288 = 0x120
  // dealRef string starts at 0x120
  const dealRef     = "ST-DEAL-008 — 142 Ridgewood Dr, De Soto MO";
  const propAddr    = "142 Ridgewood Dr, De Soto, MO 63020";

  const dealRefEncoded = encodeString(dealRef);
  const dealRefLen     = dealRefEncoded.length / 2; // bytes
  // propAddr starts at 0x120 + dealRefLen bytes
  const baseOffset  = 9 * 32; // 288
  const dealRefOff  = pad32(baseOffset.toString(16));
  const propAddrOff = pad32((baseOffset + dealRefLen).toString(16));
  const propAddrEncoded = encodeString(propAddr);

  return usdc + manager + totalTokens + faceValue + repayment + maturity +
         dealRefOff + propAddrOff + arvUSD +
         dealRefEncoded + propAddrEncoded;
}

// ─── Build-info loader ────────────────────────────────────────────────────────

function loadBuildInfoForContract(contractFile) {
  const files = fs.readdirSync(BUILD_DIR)
    .map(f => ({ f, mtime: fs.statSync(path.join(BUILD_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime) // newest first
    .map(x => x.f);
  for (const file of files) {
    const fullPath = path.join(BUILD_DIR, file);
    const info     = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    if (info.input && info.input.sources && info.input.sources[contractFile]) {
      return info;
    }
  }
  throw new Error(`No build-info found containing ${contractFile}`);
}

// ─── API helpers ──────────────────────────────────────────────────────────────

// Etherscan V2 unified API
const V2_HOST = "api.etherscan.io";
const V2_PATH = "/v2/api";

function post(params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const opts  = {
      method:   "POST",
      hostname: V2_HOST,
      path:     `${V2_PATH}?chainid=${CHAIN_ID}`,
      headers:  { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function get(params) {
  return new Promise((resolve, reject) => {
    const qs   = new URLSearchParams({ ...params, chainid: CHAIN_ID }).toString();
    const opts = {
      method:   "GET",
      hostname: V2_HOST,
      path:     `${V2_PATH}?${qs}`,
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Verify one contract ──────────────────────────────────────────────────────

async function verifyContract(contract) {
  console.log(`\n🔍  Verifying: ${contract.label}`);
  console.log(`    Address : ${contract.address}`);

  const buildInfo    = loadBuildInfoForContract(contract.contractFile);
  const compilerVer  = `v${buildInfo.solcLongVersion}`;
  const standardJson = JSON.stringify(buildInfo.input);

  // Check if already verified
  const check = await get({
    module:  "contract",
    action:  "getsourcecode",
    address: contract.address,
    apikey:  API_KEY,
  });
  if (check.result?.[0]?.SourceCode && check.result[0].SourceCode !== "") {
    console.log(`    ✅  Already verified — skipping.`);
    return;
  }

  // Submit verification
  const payload = {
    module:              "contract",
    action:              "verifysourcecode",
    apikey:              API_KEY,
    contractaddress:     contract.address,
    codeformat:          "solidity-standard-json-input",
    sourceCode:          standardJson,
    contractname:        `${contract.contractFile}:${contract.contractName}`,
    compilerversion:     compilerVer,
    constructorArguements: contract.constructorArgs, // sic — API typo
  };

  const submit = await post(payload);
  console.log(`    Submit  : ${JSON.stringify(submit)}`);

  if (submit.status !== "1") {
    console.log(`    ⚠️   Submission failed: ${submit.result}`);
    return;
  }

  const guid = submit.result;
  console.log(`    GUID    : ${guid}`);
  console.log(`    Polling for result (up to 2 min)…`);

  for (let i = 0; i < 24; i++) {
    await sleep(5000);
    const poll = await get({
      module:  "contract",
      action:  "checkverifystatus",
      guid,
      apikey:  API_KEY,
    });
    console.log(`    Poll ${String(i+1).padStart(2)}: ${poll.result}`);
    if (poll.result === "Pass - Verified") {
      console.log(`    ✅  Verified! https://polygonscan.com/address/${contract.address}#code`);
      return;
    }
    if (poll.result && !poll.result.startsWith("Pending")) {
      console.log(`    ❌  Failed: ${poll.result}`);
      return;
    }
  }
  console.log(`    ⏱️   Timed out — check PolygonScan manually.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔═════════════════════════════════════════════╗");
  console.log("║   PolygonScan Source Verification Suite      ║");
  console.log("╚═════════════════════════════════════════════╝");

  if (!API_KEY) { console.error("Missing POLYGONSCAN_API_KEY in .env"); process.exit(1); }

  for (const contract of CONTRACTS) {
    await verifyContract(contract);
    await sleep(2000); // rate limit buffer between submissions
  }

  console.log("\n✅  All contracts processed.");
  console.log("    View at: https://polygonscan.com/address/<addr>#code\n");
}

main().catch(console.error);
