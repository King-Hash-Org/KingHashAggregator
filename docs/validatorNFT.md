---
title: Specification on the Validator NFT Contract
---

The Validator NFT Contract exposes several APIs for both users and KingHash Aggregator to call. It is possible for users/institutions to launch their own Validator NFT Contract and interfacet with KingHash Aggregator. It is also possible to launch their own Staking Aggregator all together. The Validator NFT Contract uses [`ERC721A`](https://github.com/chiru-labs/ERC721A) as the base and inherits from it.

# Validator NFT API

## **whiteListMint**

`function whiteListMint(bytes calldata pubkey, address _to) external`

Mints vNFT. Do note that only Whitelisted users should be able to perform this operation, such as the KingHash Aggregator Contract.

| Name                  | Type                | Description                 | 
| --------------------------- | ----------------------- | ------------------------- |
| pubkey                        | bytes calldata        | The public key of the validator corresponding to this vNFT.
| _to                        | address        | The address which will receive the vNFT.

## **whiteListBurn**

`function whiteListBurn(uint256 tokenId) external`

Burns vNFT. Do note that only Whitelisted users should be able to perform this operation, such as the KingHash Aggregator Contract.

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

![equation](https://latex.codecogs.com/svg.image?Reward_i&space;=&space;(1&space;-&space;\alpha)\frac{total&space;Reward&space;\times&space;(current&space;Height&space;-&space;gas&space;Height_i)}{N&space;\times&space;current&space;Height&space;-&space;\sum_{n=1}^{N}&space;gas&space;Height_n})

![equation](https://latex.codecogs.com/svg.image?Fee_i&space;=&space;\frac{\alpha&space;\times&space;Reward_i}{1&space;-&space;\alpha})

This problem of rewards computation can be solved with a time complexity of at most ![equation](https://latex.codecogs.com/svg.image?\mathcal{O}\left&space;(log\;n&space;\right&space;)) given ![equation](https://latex.codecogs.com/svg.image?N) validators. This can be achieved by keeping track of cumulative sum per validator every time a vNFT is issued/burned.

Let `gas height` be the previous height in which a particular vNFT holder last claim their rewards. Therefore, the reward in which the vNFT holder should recevie should be the sum of all the rewards accumulated since `gas height` to `current height`, weighted according to the number of validators that were operating during this period. This is also demonstrated in the rewards formula shown above.

Suppose at ![equation](https://latex.codecogs.com/svg.image?t&space;=&space;0), there are ![equation](https://latex.codecogs.com/svg.image?x) amount of vNFTs minted. There will first be a fixed period of time in which we have to wait for the validators to be activated on the beacon chain before the contract can start to receive execution layer rewards from these validators. Suppose at ![equation](https://latex.codecogs.com/svg.image?t&space;=&space;T), the contract have received ![equation](https://latex.codecogs.com/svg.image?X) amount of rewards from these vNFTs. Then each validator should received ![equation](https://latex.codecogs.com/svg.image?\frac{X}{x}) amount of rewards as all of them shares the same initial `gas height`. Then we can show by mathematical induction, that as long as we tabulate the outstanding rewards everytime there is a change in number of vNFTs, we can always compute the rewards for all validators in that specific period with ![equation](https://latex.codecogs.com/svg.image?\mathcal{O}\left&space;(&space;1&space;\right&space;)) time complexity. However, the worst case time complexity to compute rewards for all period is still ![equation](https://latex.codecogs.com/svg.image?\mathcal{O}\left&space;(&space;N&space;\right&space;)) as there can be up to ![equation](https://latex.codecogs.com/svg.image?x) amount of vNFTs minted.

To deal with this problem, we store the cumulative sum of ![equation](https://latex.codecogs.com/svg.image?\frac{X}{x}) instead. One benefical property of storing the cumulative sum is that the data will always be sorted in ascending order. Thus we can perform a binary search over the data and compute the rewards in ![equation](https://latex.codecogs.com/svg.image?\mathcal{O}\left&space;(log\;n&space;\right&space;)) time complexity. The rewards will thus be given by the cumulative sum of reward currently subtracted by the cumulative sum of reward in which the vNFT holder last claimed their rewards, and this is precisely defined using the variable `gas height`.