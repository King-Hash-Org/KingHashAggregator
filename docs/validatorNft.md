---
title: Specification on the Validator Nft Contract
---

The Validator Nft Contract exposes several APIs for both users and ChainUp Aggregator to call. It is possible for users/institutions to launch their own Validator Nft Contract and interfacet with ChainUp Aggregator. It is also possible to launch their own Staking Aggregator all together. The Validator Nft Contract uses [`ERC721A`](https://github.com/chiru-labs/ERC721A) as the base and inherits from it.

# Validator Nft API

## **whiteListMint**

`function whiteListMint(bytes calldata pubkey, address _to) external`

Mints vNFT. Do note that only Whitelisted users should be able to perform this operation, such as the ChainUp Aggregator Contract.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| pubkey                        | bytes calldata        | The public key of the validator corresponding to this vNFT.
| _to                        | address        | The address which will receive the vNFT.

## **whiteListBurn**

`function whiteListBurn(uint256 tokenId) external`

Burns vNFT. Do note that only Whitelisted users should be able to perform this operation, such as the ChainUp Aggregator Contract.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| tokenId                        | uint256        | The tokenId of the vNFT.

## **claimRewards**

`function claimRewards(uint256 tokenId) external`

Claim vNFT rewards.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| tokenId                        | uint256        | The tokenId of the vNFT.

## **batchClaimRewards**

`function batchClaimRewards(uint256[] calldata tokenIds) external`

Batch claim vNFT rewards.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| tokenIds                        | uint256[] calldata   | An array of tokenIds.

## **totalHeight**

`function totalHeight() external view returns (uint256)`

The total gas height of all active validators. Gas height is used to determine how much rewards a validator should get.

## **activeValidators**

`function activeValidators() external view returns (bytes[] memory)`

Get all the public keys of active validators.

## **validatorExists**

`function validatorExists(bytes calldata pubkey) external view returns (bool)`

Check if a given validator exists, this includes inactive validators.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| pubkey                       | bytes calldata   | The public key of the validator.

## **validatorOf**

`function validatorOf(uint256 tokenId) external view returns (bytes memory)`

Get the validator's public key of a vNFT.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| tokenId                        | uint256        | The tokenId of the vNFT.

## **validatorOfOwner**

`function validatorsOfOwner(address owner) external view returns (bytes[] memory)`

Get all the validators' public key of a particular address.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| owner                  | address        | TAddress of the vNFT owner.

## **tokenOfValidator**

`function tokenOfValidator(bytes calldata pubkey) external view returns (uint256)`

Get the tokenId of a validator's public key.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| pubkey                | bytes calldata       | The public key of the vNFT.

## **gasHeightOf**

`function gasHeightOf(uint256 tokenId) external view returns (uint256)`

Get the gas height of a vNFT. Gas height is used to determine how much rewards a validator should get.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| tokenId                        | uint256        | The tokenId of the vNFT.

# Rewards Computation
The rewards computation is as follows:

![equation](https://latex.codecogs.com/svg.image?N&space;=&space;number&space;&space;of&space;&space;nodes)

![equation](https://latex.codecogs.com/svg.image?\alpha&space;=&space;0.1&space;=&space;10\%&space;=&space;comission)

![equation](https://latex.codecogs.com/svg.image?Reward_i&space;=&space;(1&space;-&space;\alpha)\frac{total\_reward&space;\times&space;(current\_height&space;-&space;gas\_height_i)}{N&space;\times&space;current\_height&space;-&space;\sum_{n=1}^{N}&space;gas\_height_n})

![equation](https://latex.codecogs.com/svg.image?Fee_i&space;=&space;\frac{\alpha&space;\times&space;Reward_i}{1&space;-&space;\alpha})