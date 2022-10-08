// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface ISwellController { 
        /**
     * @notice Adds `sETH2Balance` shares to `swETHBalanceMap` that keep tracks of swETH Tokens owned by each address.
     * @param userAddress : the user's unique address.
     * @param swETHBalance : swETH Tokens owned.
     * @dev `userAddress` cannot be the zero address, `msg.sender` must be inside list of allowed addresses.
     */
    function addSWETHBalance(address userAddress, uint256 swETHBalance) external;

    /**
     * @notice Returns the balance of swETH Tokens owned by the address `userAddress`.
     * @param userAddress : the user's unique address
     * @return uint256 : swETH Balance owned by `userAddress`.
     */
    function getSWETHBalance(address userAddress) external view returns (uint256);

    /**
     * @notice Adds `userAddress` to a list of allowed address, `allowList`.
     * @param userAddress : the user's unique address
     * @dev will only allow call of function by the address registered as the owner
     */
    function addAllowList(address userAddress) external;

    /**
     * @notice Remove `userAddress` from a list of allowed address, `allowList`.
     * @param userAddress : the user's unique address
     * @dev will only allow call of function by the address registered as the owner
     */
    function removeAllowList(address userAddress) external;
}