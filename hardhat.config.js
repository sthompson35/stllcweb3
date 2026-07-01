require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const _PK            = process.env.DEPLOYER_PRIVATE_KEY;
const PK             = _PK && /^0x[0-9a-fA-F]{64}$/.test(_PK) ? _PK : null;
const POLYGON_RPC    = process.env.POLYGON_RPC_URL      || "https://polygon-rpc.com";
const AMOY_RPC       = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const POLYGONSCAN_KEY = process.env.POLYGONSCAN_API_KEY  || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
      {
        version: "0.8.15",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    ],
    overrides: {
      "contracts/core/CTFExchange.sol": {
        version: "0.8.15",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    },
  },

  paths: {
    sources:   "./contracts",   // after moving .sol files to contracts/
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    polygonAmoy: {
      url:      AMOY_RPC,
      chainId:  80002,
      ...(PK ? { accounts: [PK] } : {}),
    },
    polygon: {
      url:      POLYGON_RPC,
      chainId:  137,
      ...(PK ? { accounts: [PK] } : {}),
    },
  },

  etherscan: {
    apiKey: {
      polygon:     POLYGONSCAN_KEY,
      polygonAmoy: POLYGONSCAN_KEY,
    },
  },

  sourcify: { enabled: false },

  gasReporter: {
    enabled:  process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};