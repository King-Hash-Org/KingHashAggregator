// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface IAggregator {
    function stake(bytes[] calldata data) payable external returns (bool);

    function unstake(bytes[] calldata data) payable external returns (bool);

    function disperseRewards(uint256 tokenId) external;
}