require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("solhint");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const GOERLI_ACCOUNT_1 = process.env.GOERLI_ACCOUNT1;
const GOERLI_ACCOUNT_2 = process.env.GOERLI_ACCOUNT2;
const GOERLI_ACCOUNT_3 = process.env.GOERLI_ACCOUNT3;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.8",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      chainId: 5,
      blockConfirmations: 6,
      accounts: [GOERLI_ACCOUNT_1, GOERLI_ACCOUNT_2, GOERLI_ACCOUNT_3],
    },
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
  },
  namedAccounts: {
    deployer: {
      5: 0,
      31337: 0,
      default: 0,
    },
    fifth: {
      5: 2,
      31337: 4,
      default: 4,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
  },
  mocha: {
    timeout: 300000,
  },
};
