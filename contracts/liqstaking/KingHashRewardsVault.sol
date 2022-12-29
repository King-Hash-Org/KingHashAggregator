// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IKingHash {
    /**
      * @notice A payable function supposed to be called only by ExecLayerRewardsVault contract
      * @dev We need a dedicated function because funds received by the default payable function
      * are treated as a user deposit
      */
    function receiveELRewards() external payable;
}

// upgradeable
contract KingHashRewardsVault is
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    /**
     * Emitted when the vault received ETH
     */
    event ETHReceived(uint256 amount);
    address public liquidStakingVault;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function initialize(address _kinghash) external initializer {
        require(_kinghash != address(0), "KINGHASH_ZERO_ADDRESS");
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        liquidStakingVault = _kinghash;
    }

    /**
     * @notice Allows the contract to receive ETH
     * @dev execution layer rewards may be sent as plain ETH transfers
     */
    receive() external payable {
        emit ETHReceived(msg.value);
    }

    /**
     * @notice Withdraw all accumulated rewards to  contract
     * @dev Can be called only by the  contract
     * @param _maxAmount Max amount of ETH to withdraw
     * @return amount of funds received as execution layer rewards (in wei)
     */
    function withdrawRewards(
        uint256 _maxAmount
    ) external nonReentrant returns (uint256 amount) {
        require(msg.sender == liquidStakingVault, "ONLY_KINGHASH_CAN_WITHDRAW");

        uint256 balance = address(this).balance;
        amount = (balance > _maxAmount) ? _maxAmount : balance;
        if (amount > 0) {
            IKingHash(liquidStakingVault).receiveELRewards{value: amount}();
        }
        return amount;
    }
}
