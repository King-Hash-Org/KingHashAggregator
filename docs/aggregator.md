---
title: Specification on the Aggregator Contract
---

The ChainUp Aggregator Contract exposes several APIs for user to call. While it is possible to bypass all of that with [ChainUp Aggregator API](https://chainupcloud.github.io/swagger/) or through our [frontend](https://staking.chainupcloud.com/), the goal of this document is to allow creators to come up with their own Smart Engine to interface with ChainUp Aggregator Contract.

# Aggregator API

## **stake**

`function stake(bytes[] calldata data) payable external`

Stakes Ether.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| data                        | bytes[] calldata        | An array of staking instruction. Each element of the data array is a stake instruction the Aggregator will execute.

## **unstake**

`function unstake(bytes[] calldata data) payable external`

Unstakes Ether.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| data                        | bytes[] calldata        | An array of unstaking instruction. Each element of the data array is a unstake instruction the Aggregator will execute.

## **claimRewards**

`function claimRewards(address from_) external`

Claim vNFT rewards.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| from_                        | address        | The owner of the vNFT. It will claim all the rewards if the owner owns mulitple vNFTs.

# Instruction Breakdown

Both the `stake` and `unstake` instructions is composed through a series of bytes. In this section, we will explain the exact layout of the instruction.

## **stake**

The bytes is expected to be layout as follows:
```
Bytes: | OP_CODE | ADDITIONAL_DATA |
       |   [0]   |     [1:N]       |
```
| OP_CODE                     | Description             |
| --------------------------- | ----------------------- | 
| 0x1                         | vNFT staking strategy. This instruction requires 32 Eth to execute and spins up a Validator Node for the sender. Sender also recieves a vNFT. |
| 0x2 | Lido staking strategy. This instruction requires at least 1 wei to execute. stEth is not return to the user by default and further re-invested in the Lidoverse |
| 0x3 | Swell staking strategy. This instrucion requires at least 1 Eth to execute. |
| 0x4 | Rocketpool staking strategy. This instruction requires 0.01 Eth to execute. rEth is not return to the user by default and further re-invested in the Rocketverse. |
| 0x5 | Stakewise staking strategy. StakeWise Staked Eth2 will  |
| 0x6 | Purchase vNFT strategy. This instruction purchases a vNFT from users who have listed

