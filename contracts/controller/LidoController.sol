// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../controller-interface/ILidoController.sol";

 contract LidoController is  ILidoController, ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable  {
   
    mapping(address => bool) private allowList;
    address private referral;
    mapping(address => uint256) private stEthSharesMap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize() external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        //set referral to internal chainup address (optional)
        referral = address(0x27e2119Bc9Fbca050dF65dDd97cB9Bd14676a08b);
    }

    modifier onlyAllowed() {
        require(allowList[msg.sender], "Not allowed to add SETH Shares Balance");
        _;
    }
    
    function getReferral() external view override returns (address) {
        return referral;
    }

    function addStEthShares(address userAddress, uint256 stEthBalance) external override onlyAllowed nonReentrant {
        require( userAddress != address(0), "User should not be zero address");
        stEthSharesMap[userAddress] += stEthBalance;
    }

    function getStEthShares(address userAddress ) external view override returns (uint256) {
        return  stEthSharesMap[userAddress] ;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
  
    function addAllowList(address userAddress) external override onlyOwner {
        require( userAddress != address(0), "User should not be zero address");
        allowList[userAddress] = true;
    }

    function removeAllowList(address userAddress) external override onlyOwner {
        require( userAddress != address(0), "User should not be zero address");
        allowList[userAddress] = false;
    }



 }
