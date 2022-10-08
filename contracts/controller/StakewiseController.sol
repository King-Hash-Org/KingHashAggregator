// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../controller-interface/IStakewiseController.sol";

 /** @title Controller for Rocket Pool Strategy
  * @author ChainUp Dev
  * @dev Interacts with the SwellRouter and read and writes data
 **/
 contract StakewiseController is  IStakewiseController, ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable  {
    
    mapping(address => bool) private allowList;
    mapping(address => uint256) private sETH2BalanceMap;
     
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
        require(allowList[msg.sender], "Not allowed to add sETH2 Balance");
        _;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
    * @dev See {ISwellController-addSETH2Balance}.
    */
    function addSETH2Balance(address userAddress, uint256 sETH2Balance) external override onlyAllowed nonReentrant {
        require( userAddress != address(0), "User should not be zero address");
        sETH2BalanceMap[userAddress] += sETH2Balance;
    }
  
    /**
    * @dev See {ISwellController-getSETH2Balance}.
    */
    function getSETH2Balance(address userAddress ) external view override returns (uint256) {
        return  sETH2BalanceMap[userAddress] ;
    }

    /**
    * @dev See {ISwellController-addAllowList}.
    */
    function addAllowList(address userAddress) external override onlyOwner {
        require(userAddress != address(0), "User should not be zero address");
        allowList[userAddress] = true;
    }

    /**
    * @dev See {ISwellController-removeAllowList}.
    */
    function removeAllowList(address userAddress) external override onlyOwner {
        allowList[userAddress] = false;
    }

    function getAllowList(address userAddress) external view returns (bool) {
        return allowList[userAddress] ;
    }

 }