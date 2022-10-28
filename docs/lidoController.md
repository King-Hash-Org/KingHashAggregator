---
title: Specification on the Lido Controller Contract
---

 Lido stakers can earn daily staking rewards by simply staking their assets through rebasing and re-investing through other DEFI Protocols - Yearn, Balancer, Curve, Harvest Finance , just to name afew. The Lido Controller Contract interacts with the LidoRouter and help to re-invest the user's STETH and generate yield accordingly to the selected strategy , this is available for both users and KingHash Aggregator to call.  
 The Lido Controller Contract uses the following 
 [`OwnableUpgradeable`](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/access/OwnableUpgradeable.sol) 
 [`ReentrancyGuardUpgradeable`](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/security/ReentrancyGuardUpgradeable.sol) 
 [`UUPSUpgradeable`](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/proxy/utils/UUPSUpgradeable.sol) 
 
 as the base and inherits from it.

# Lido Controller API

## **addStEthShares**

`function addStEthShares(address userAddress, uint256 stEthShares) external`

add stETHShares to mapping that keep tracks of shares owned by each individual address. Do note that only certain authorized users should be able to perform this operation, such as the KingHash Aggregator Contract.

| Name                  | Type        | Description                           | 
| --------------------- | ------------| -----------------------------------   |
| userAddress           | address     | The address which owns the stETHShares.
| stEthShares           | uint256     | The amount of stEthShares owned by the user. 
