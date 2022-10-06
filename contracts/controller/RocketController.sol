// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../controller-interface/IRocketController.sol";

 /** @title Controller for Rocket Pool Strategy
  * @author ChainUp Dev
  * @dev Interacts with the RocketPoolRouter and read and writes data
 **/
 contract RocketController is  IRocketController, ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable  {
   
    mapping(address => bool) private allowList;
    mapping(address => uint256) private rEthBalanceMap;

    /**
    * @notice Initializes the contract by setting the required external contracts ,
    * ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable and `referral`.   
    * @dev initializer- A modifier that defines a protected initializer function that can be invoked at most once. 
    **/
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
  
    /**
    * @dev See {IRocketController-addREthBalance}.
    */
    function addREthBalance(address userAddress, uint256 rEthBalance) external override onlyAllowed nonReentrant {
        require( userAddress != address(0), "User should not be zero address");
        rEthBalanceMap[userAddress] += rEthBalance;
    }
  
    /**
    * @dev See {IRocketController-getREthBalance}.
    */
    function getREthBalance(address userAddress ) external view override returns (uint256) {
        return  rEthBalanceMap[userAddress] ;
    }

    /**
    * @dev See {IRocketController-addAllowList}.
    */
    function addAllowList(address userAddress) external override onlyOwner {
        require(userAddress != address(0), "User should not be zero address");
        allowList[userAddress] = true;
    }

    /**
    * @dev See {IRocketController-removeAllowList}.
    */
    function removeAllowList(address userAddress) external override onlyOwner {
        allowList[userAddress] = false;
    }

    function getAllowList(address userAddress) external view returns (bool) {
        return allowList[userAddress] ;
    }

 }
