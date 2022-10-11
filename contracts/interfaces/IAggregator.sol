// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

/* @title Interface for Aggregator
    @author ChainUp Dev
    @notice Execute different functions for the user accordingly. 
*/

interface IAggregator {

    /**
    * @notice Route user's investment into different protocols
    * @param data - byte array which has unique prefix for different strategy 
    * @return bool return true if staked amount adds up to initial staked amount.
    **/
    function stake(bytes[] calldata data) payable external returns (bool);

    function unstake(bytes[] calldata data) payable external returns (bool);
}