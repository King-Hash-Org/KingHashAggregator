// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface IKingHashRewardsVault  {

    /**
    * @notice Withdraw all accumulated execution layer rewards to KingHash Liq Staking contract
    * @param _maxAmount Max amount of ETH to withdraw
    * @return amount of funds received as execution layer rewards (in wei)
    */
    function withdrawRewards(uint256 _maxAmount) external returns (uint256 amount);
}