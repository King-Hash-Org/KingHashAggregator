---
title: Setting up DAO with ChainUp Aggregator
---

The various contracts under ChainUp Aggregator should not be owned by a centralized identity. Hence, a DAO mechanism is used around the protocol. Users can follow the steps to transfer the ownership of the various contracts to a DAO and protecting it with a multisig.

# Setting up
1. We assumed that you have deployed the various contracts according to [this](../README.md).
2. You should now have a couple of `Controller` contracts, `Vault` contracts, one `Aggregator` contract and one `ValidatorNFT` contract. 
    * `Controller` contracts are contracts that has funds within it and can be potentially managed.
    * `Vault` contracts are contracts that has funds within it and cannot be managed. They are strictly for withdrawal purposes.
    * `Aggregator` contract is responsible for routing and execution of strategies. It interfaces with other contracts and is replacable.
    * `ValidatorNFT` contract is reponsible for representing a validator node. It is a NFT and allow validators to be traded as NFTs.
3. Visit [Gnosis Safe](https://gnosis-safe.io/app) and create a multisig wallet.
4. Note down the multisig wallet and set it as the sole executor into the `./scripts/deployTimelock.ts`.
5. Set the proposer to be the developer addresses and also multisig itself into the `./scripts/deployTimelock.ts`.
6. Choose a minimum delay and set it into the `./scripts/deployTimelock.ts`. We recommend a duration of 24hrs.
7. Run `npx hardhat run scripts/deployTimelock.ts --network goerli` to deploy the Timelock Contract on Goerli.
8. Call `transferOwnership` on the `Aggregator.sol` proxy's contract to transfer the owner of the contract to the `TimelockController.sol` contract.
9. Now, the `Aggregator.sol` is owned by `TimelockController.sol` contract!

# Upgrade
1. Deploy the updated contract. Note down the new address.
2. Call `schedule` on the `TimelockController.sol` with the following parameters:
    * target(address): `Aggregator Proxy Address`
    * value(uint256): 0
    * data(bytes): `0x3659cfe6000000000000000000000000 + new address`
    * predecessor(bytes32): `0x0000000000000000000000000000000000000000000000000000000000000000`
    * salt(bytes32): `0x0000000000000000000000000000000000000000000000000000000000000000`
    * delay(uint256): `delay time`
3. Wait for `delay time` to pass and get the multisig to execute the upgrade.
4. Visit [Gnosis Safe](https://gnosis-safe.io/app) and schedule a new transaction.
5. Call `execute` on the `TimelockController.sol` with the following parameters:
    * target(address): `Aggregator Proxy Address`
    * value(uint256): 0
    * payload(bytes): `0x3659cfe6000000000000000000000000 + new address`
    * predecessor(bytes32): `0x0000000000000000000000000000000000000000000000000000000000000000`
    * salt(bytes32): `0x0000000000000000000000000000000000000000000000000000000000000000`
    * delay(uint256): `delay time`
6. Once the threshold is met, the command can be executed and upgrade can be deployed.