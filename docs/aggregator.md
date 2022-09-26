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
| 0x01                         | vNFT staking strategy. This instruction requires 32 Eth to execute and spins up a Validator Node for the sender. Sender also recieves a [vNFT](./ValidatorNft.md). |
| 0x02 | Lido staking strategy. This instruction requires at least 1 wei to execute. stEth is not returned to the user by default and further re-invested in the [Lidoverse](https://lido.fi/lido-ecosystem). |
| 0x03 | Swell staking strategy. This instrucion requires at least 1 Eth to execute. Derivatives are not returned to the user by default and further re-invested in the [Swellverse](https://swellnetwork.io/). |
| 0x04 | Rocketpool staking strategy. This instruction requires 0.01 Eth to execute. rEth is not returned to the user by default and further re-invested in the [Rocketverse](https://rocketpool.net/). |
| 0x05 | Stakewise staking strategy. This instruction requires 1 Wei to execute. Stakewise Eth is returned to the user by default.  |
| 0x06 | vNFT purchase strategy. This instruction purchases a vNFT from users who have listed their [vNFT](./ValidatorNft.md).
| 0x07 | SSV vNFT strategy. This instruction purchases a vNFT supercharged through the [SSV network](https://ssv.network/).
| 0x08 | Frax staking strategy. This instruction requires at least 1 Weu to execute. sfrxEth is not returned to the user by default and further re-invested in the [Frax Holy Land](https://frax.finance/).
| 0x09 - 0xFF | RESERVED

### **vNFT Staking Strategy**

| OP_CODE                     | 
| --------------------------- | 
| 0x01                        | 

```
Bytes: | OP_CODE |  V  | Pubkey  | Withdrawal Credentials | Signature | Deposit Data Root | Block Number |     S     |     R     |
       |   [0]   | [1] | [16:64] |        [64:96]         |  [96:192] |     [192:224]     |   [224:256]  | [256:288] | [288:320] |
```

**Signature**

An Ethereum Signature comprises of 3 parameters:
* R --> 32 bytes
* S --> 32 bytes
* V --> 1 byte

You can read more [here](https://blog.openzeppelin.com/signing-and-validating-ethereum-signatures/), an article written by OpenZeppelin.

**Block Number**

Block number is a 32 bytes number representing an Ethereum block number. To prevent time delay attack, the **Signature (R, S, V)** is performed over a specific block number. The transaction would be reverted if the current block number exceeds the one stated in the signature.

**Deposit Data**

The deposit data is a specification created by Ethereum. You can learn more about it [here](https://launchpad.ethereum.org/en/faq) and the reason why they made it.

A Valid Deposit Data comprises of 4 parameters:
* pubkey --> 48 bytes
* withdrawal_credentials --> 32 bytes
* signature --> 96 bytes
* deposit_data_root --> 32 bytes

The deposit data can be obtained by using [Ethereum Tools](https://launchpad.ethereum.org/en/generate-keys)

### **Lido Staking Strategy**

| OP_CODE                     | 
| --------------------------- | 
| 0x02                        | 

```
Bytes: | OP_CODE | Amount  |
       |   [0]   | [32:64] | 
```

**Amount**

The amount of Eth that is to be staked. It is represented as `uint256` or `bytes32`.

### **Swell Staking Strategy**

| OP_CODE                     | 
| --------------------------- | 
| 0x03                        | 

```
Bytes: | OP_CODE | Pubkey  | Signature | Deposit Data Root |  Amount   | 
       |   [0]   | [16:64] | [64:160]  |     [160:192]     | [192:224] |
```

**Deposit Data**

The deposit data is a specification created by Ethereum. You can learn more about it [here](https://launchpad.ethereum.org/en/faq) and the reason why they made it.

A Valid Deposit Data comprises of 4 parameters:
* pubkey --> 48 bytes
* withdrawal_credentials --> 32 bytes
* signature --> 96 bytes
* deposit_data_root --> 32 bytes

**Amount**

The amount of Eth that is to be staked. It is represented as `uint256` or `bytes32`.

### **Rocketpool Staking Strategy**

| OP_CODE                     | 
| --------------------------- | 
| 0x04                        | 

```
Bytes: | OP_CODE | Amount  |
       |   [0]   | [32:64] | 
```

**Amount**

The amount of Eth that is to be staked. It is represented as `uint256` or `bytes32`.

### **Stakewise Staking Strategy**

| OP_CODE                     | 
| --------------------------- | 
| 0x05                        | 

```
Bytes: | OP_CODE | Amount  |
       |   [0]   | [32:64] | 
```

**Amount**

The amount of Eth that is to be staked. It is represented as `uint256` or `bytes32`.

### **vNFT Purchase Strategy**

| OP_CODE                     | 
| --------------------------- | 
| 0x06                        | 

```
Bytes: | OP_CODE | auth.V | auth.Address | auth.R  | auth.S  |  Auth.Block  |   Length   | Listing Info x Length |
       |   [0]   |  [1]   |    [12:32]   | [32:64] | [64:96] |   [96:128]   |  [128:160] |   [160:length * 224]  |
```

The layout of each Listing Info is as follows:
```
Bytes: | Price  | TokenId  | Rebate  | Block Number |  user.R   |  user.S   | user.Address | user.V | user.nonce |
       | [0:32] |  [32:64] | [64:96] |   [96:128]   | [128:160] | [160:192] |   [192:212]  |  [213] |  [216:224] |
```

**Auth**

The **Auth** consists of a **Signature** and a **Block Number (Auth.Block)**. And followed by a **Length**, entailing the information of the vNFT the user is buying.

**Signature**

An Ethereum Signature comprises of 3 parameters:
* R --> 32 bytes
* S --> 32 bytes
* V --> 1 byte

You can read more [here](https://blog.openzeppelin.com/signing-and-validating-ethereum-signatures/), an article written by OpenZeppelin.

**Block Number**

Block number is a 32 bytes number representing an Ethereum block number. To prevent time delay attack, the **Signature (R, S, V)** is performed over a specific block number. The transaction would be reverted if the current block number exceeds the one stated in the signature.

**Length**

Length is a 32 bytes number representing the number of listings.

**Listing Info**

The **Listing info** consists of **Price**, **TokenId**, **Rebate** which represents the vNFT selling information. It also comes with the **User Signature (R, S, V)** and **Block Number** which proves that the user indeed has created the sell order and prevents time delay attack.

**Price**

Price is a 32 bytes number representing the price of the vNFT.

**TokenId**

TokenId is a 32 bytes number representing the tokenId of the vNFT.

**Rebate**

Rebate is a 32 bytes number representing the rebate of the vNFT. As the vNFT value is always increasing, the user should state the minimum amount they are expecting to sell their vNFT. Internally, we convert this amount to rebate so as to allow the sell order to accrue a value automatically whilst storing a constant. 

TLDR: `rebate + price > value_of_node`

**Nonce**

A nonce for each address. To prevent replay attacks.