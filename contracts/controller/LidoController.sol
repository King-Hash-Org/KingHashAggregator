// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../controller-interface/ILidoController.sol";

/** 
 * @title Controller for Lido Strategy
 * @dev Interacts with the LidoRouter and read and writes data
 */
contract LidoController is ILidoController, ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    mapping(address => bool) private allowList;
    address private referral;
    mapping(address => uint256) private stEthSharesMap;

    /**
     * @notice Initializes the contract  by setting the required external contracts,
     *         ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable and `referral`.
     * @dev initializer - A modifier that defines a protected initializer function that can be invoked at most once.
     */
    function initialize() external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        referral = address(0x27e2119Bc9Fbca050dF65dDd97cB9Bd14676a08b); //(optional)
    }

    modifier onlyAllowed() {
        require(allowList[msg.sender], "Not allowed to add SETH Shares Balance");
        _;
    }

    /**
     * @dev See {ILidoController-getReferral}.
     */
    function getReferral() external view override returns (address) {
        return referral;
    }

    /**
     * @dev See {ILidoController-addStEthShares}.
     */
    function addStEthShares(address userAddress, uint256 stEthShares) external override onlyAllowed nonReentrant {
        require(userAddress != address(0), "User should not be zero address");
        stEthSharesMap[userAddress] += stEthShares;
    }

    /**
     * @dev See {ILidoController-getStEthShares}.
     */
    function getStEthShares(address userAddress) external view override returns (uint256) {
        return stEthSharesMap[userAddress];
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev See {ILidoController-addAllowList}.
     */
    function addAllowList(address userAddress) external override onlyOwner {
        require(userAddress != address(0), "User should not be zero address");
        allowList[userAddress] = true;
    }

    /**
     * @dev See {ILidoController-removeAllowList}.
     */
    function removeAllowList(address userAddress) external override onlyOwner  {
        allowList[userAddress] = false;
    }

    function getAllowList(address userAddress) external view returns (bool) {
        return allowList[userAddress];
    }
}