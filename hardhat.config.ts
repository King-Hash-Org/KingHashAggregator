import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {

  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },
  gasReporter: {
    enabled: true,
  }
};
