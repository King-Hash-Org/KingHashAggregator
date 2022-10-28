---
title: Specification on the Rocket Controller Contract
---

 Rocket stakers can earn daily staking rewards by simply staking their assets through rebasing and re-investing through other DEFI Protocols(RocketPool Verse) . The Rocket Controller Contract interacts with the RocketRouter and help to re-invest the user's rETH and generate yield accordingly to the selected strategy , this is available for both users and KingHash Aggregator to call.  
 The Rocket Controller Contract uses the following 
 [`OwnableUpgradeable`](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/access/OwnableUpgradeable.sol) 
 [`ReentrancyGuardUpgradeable`](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/security/ReentrancyGuardUpgradeable.sol) 
 [`UUPSUpgradeable`](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/proxy/utils/UUPSUpgradeable.sol) 
 as the base and inherits from it.

# Rocket Controller API

## **addREthBalance**

`function addREthBalance(address userAddress, uint256 rEthBalance) external`

add rEth Tokens to mapping that keep tracks of shares owned by each individual address. Do note that only certain authorized users should be able to perform this operation, such as the KingHash Aggregator Contract.

| Name                  | Type        | Description                           | 
| --------------------- | ------------| -----------------------------------   |
| userAddress           | address     | The address which owns the rEth Tokens.
| rEthBalance           | uint256     | The amount of rEth Tokens owned by the user. 
