// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../controller-interface/IRocketController.sol";

 contract RocketController is  IRocketController, ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable  {
   
    mapping(address => bool) private allowList;
    mapping(address => uint256) private rEthBalanceMap;


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize() external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    modifier onlyAllowed() {
        require(allowList[msg.sender], "Not allowed to add RETH Balance");
        _;
    }
    

    function _authorizeUpgrade(address) internal override onlyOwner {}
  
    function addAllowList(address userAddress) external override onlyOwner {
        allowList[userAddress] = true;
    }

    function removeAllowList(address userAddress) external override onlyOwner {
        allowList[userAddress] = false;
    }

    function addREthBalance(address userAddress, uint256 rEthBalance) external override onlyAllowed nonReentrant {
        require( userAddress != address(0), "User should not be zero address");
        rEthBalanceMap[userAddress] += rEthBalance;
    }

    function getREthBalance(address userAddress ) external view override returns (uint256) {
        return  rEthBalanceMap[userAddress] ;
    }


 }
