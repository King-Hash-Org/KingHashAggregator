# ChainUp Aggregator

![CHAINUP new logo-2022 浅底横](https://user-images.githubusercontent.com/103015469/191217935-895ab918-3644-4c86-bfda-9599c8639c91.png)

![node](https://img.shields.io/badge/node-v16.14.2-green)
![npm](https://img.shields.io/badge/npm-v8.5.0-green)
![python](https://img.shields.io/badge/python-v3.8.10-green)
![solidity](https://img.shields.io/badge/solidity-0.8.7-brightgreen)
![license](https://img.shields.io/github/license/ChainUp-Cloud/ChainUpAggregator)
![contributors](https://img.shields.io/github/contributors/ChainUp-Cloud/ChainUpAggregator)

<!--
| Statements                  | Branches                | Functions                 | Lines             |
| --------------------------- | ----------------------- | ------------------------- | ----------------- |
| ![Statements](https://img.shields.io/badge/statements-66.49%25-red.svg?style=flat) | ![Branches](https://img.shields.io/badge/branches-57.81%25-red.svg?style=flat) | ![Functions](https://img.shields.io/badge/functions-82.35%25-yellow.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-67.38%25-red.svg?style=flat) |
-->

This repository contains the core smart contracts for the [ChainUp Aggregator Protocol](https://staking.chainupcloud.com/). ChainUp Aggregator Protocol is a smart contract for various Eth staking strategies. ChainUp Aggregator Protocol is part of the suite of products [ChainUp Cloud](https://docs.chainupcloud.com/) offers.

**Overview**

* [Architecture](./docs/architecture.md)
* [Aggregator](./docs/aggregator.md)
* [ValidatorNft](./docs/validatorNft.md)

You can find more generic information about ChainUp Aggregator over [here](https://docs.chainupcloud.com/introduction/products/chainup-aggregator).

![image](https://user-images.githubusercontent.com/103015469/191221110-792b96bc-9f60-43eb-a836-f018efe1b5ea.png)

# Quick Commands

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts --network ropsten
npx hardhat run scripts/upgrade.ts --network ropsten
npx hardhat clean
npx hardhat coverage
```

# Setting Up

1. Ensure you have installed `node ^v16.14.2` and `npm ^8.5.0`. We recommend using `nvm` to install both `node` and `npm`. You can find the `nvm` installation instructions [here](https://github.com/nvm-sh/nvm#installing-and-updating).
2. Run `npm install` to install the dependencies.
3. Run `npx hardhat compile` to compile the code.
4. Run `npx hardhat clean` when you run into issues.
5. Run `npx hardhat test` to run the tests.

# Deploy

Pre-requisite:

Setup your `.env` with the following keys:

```
ROPSTEN_URL=https://ropsten.infura.io/v3/<YOUR_INFURA_API_KEY>
ROPSTEN_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
ETHERSCAN_KEY=<YOUR_ETHERSCAN_API_KEY>
```

1. The deploy order is NftContract > Vault > Aggregator.
2. Run `npx hardhat run scripts/deployNft.ts --network ropsten` to deploy the Nft Contract on Ropsten.
3. Note down the `nftContract` address and update it in `./scripts/deployVault.ts`
4. Run `npx hardhat run scripts/deployNodeRewardVault.ts --network ropsten` to deploy the Vault Contract on Ropsten.
5. Note down the `vaultContract` proxy's address and update both the `nftContract` and `vaultContract` proxy's into the `./scripts/deployAggregator.ts`.
6. Run `npx hardhat run scripts/deployAggregator.ts --network ropsten` to deploy the Aggregator Contract on Ropsten.
7. Note down the `aggregatorContract` proxy's address and interact with the `nftContract` and `vaultContract` to update them.

# Other Tools

## Coverage

To get code coverage do `npx hardhat coverage`.

The html files inside `/coverage` folder will tell you what's missing coverage. You can use Coverage Gutter plugin on VSCode to facilitate this.

We want 100% coverage on any smart contract code that gets deployed. If code doesn't need to be used, it should not be there. And whatever code does exist in the smart contract needs to be run by the tests.

To generate the coverage badge, run `npm run make-badges` after running coverage. It generates the badge from `coverage/coverage-summary.json`.

## Slither - Security Analyzer

`pip3 install slither-analyzer` and
`slither .` inside the repo.

We also recommend to install the [slither vscode extension](https://marketplace.visualstudio.com/items?itemName=trailofbits.slither-vscode).

Run it after major changes and ensure there arent any warnings / errors.

To disable slither, you can add `// slither-disable-next-line DETECTOR_NAME`.

You can find `DETECTOR_NAME` [here](https://github.com/crytic/slither/wiki/Detector-Documentation).

## Mythril - Fuzz tests

`pip3 install mythril`

Run `myth analyze ./contracts/Aggregator.sol --solc-json mythril.json --solv 0.8.7` to begin analyze. Note that this process can take a **very** long time.

You can run with `myth analyze ./contracts/Aggregator.sol --solc-json mythril.json --solv 0.8.7 --execution-timeout 3000` to limit the analyzation time. But the testing will not be as thorough.

You can see further instructions for Mythril [here](https://github.com/ConsenSys/mythril).

## Surya - GraphViz for Architecture

Install Surya using : `npm install -g surya`

To create a graphviz summary of all the function calls do, `surya graph contracts/**/*.sol > FM_full.dot` and open `FM_full.dot` using a graphviz plugin on VSCode.

`surya describe contracts/**/*.sol` will summarize the contracts and point out fn modifiers / payments. It's useful to get an overview.

You can see further instructons for Surya [here](https://github.com/ConsenSys/surya).


# Contracts (Ropsten)
Aggregator Proxy: `0x752fa2DfD67d14e9b01D98c2EE4A4F4A61e2eA85`

NodeRewardVault Proxy: `0x3130055114d9F68F91D037a8CfCDAcD8ed46755F`

NodeCapitalVault Proxy: `0xD9E2dc13b0d2F6f73cd21C32fBf7dE143C558e29`

vNFT: `0x60b741e2F3A343B281d6bce50d5F2bA4fADc04bC`

# Audits
The following auditors were engaged to review the project before launch:
* [Beosin Audit](https://beosin.com/) (In Progress)