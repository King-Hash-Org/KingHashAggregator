// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

/** 
 * @title Staking Aggregator Interface for Ethereum Network
 * @notice Execute different functions for the user accordingly
 */
interface IAggregator {
    /**
     * @notice Route user's investment into different protocols
     * @param data - byte array which has unique prefix for different strategy 
     * @return true if operation succeeded
     */
    function stake(bytes[] calldata data) payable external returns (bool);

    function unstake(bytes[] calldata data) payable external returns (bool);

    /**
     * @notice Transfer earned rewards to nft owner
     * @param tokenId - representation of user's nft
     */
    function disperseRewards(uint256 tokenId) external;

    function claimRewards(uint256 tokenId) external;

    function batchClaimRewards(uint256[] calldata tokenIds) external;
}