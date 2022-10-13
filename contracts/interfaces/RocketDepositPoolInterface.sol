// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.7;

/**
 * @title Interface for RocketPool Liquid staking pool
 * @notice Accepts user-deposited ETH and handles assignment to minipools
 *         Implement custom deposit logic which funnels user deposits into the deposit poo
 */
interface RocketDepositPoolInterface {
    /**
     * @notice Deposits ETH into Rocket Pool and minted rETH back to the caller
     */    
    function deposit() external payable;
}