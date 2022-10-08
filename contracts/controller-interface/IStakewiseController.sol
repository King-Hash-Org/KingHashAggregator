// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface IStakewiseController { 
        /**
     * @notice Adds `sETH2Balance` shares to `sETH2BalanceMap` that keep tracks of sETH2 Tokens owned by each address.
     * @param userAddress : the user's unique address.
     * @param sETH2Balance : sETH2 Tokens owned.
     * @dev `userAddress` cannot be the zero address, `msg.sender` must be inside list of allowed addresses.
     */
    function addSETH2Balance(address userAddress, uint256 sETH2Balance) external;

    /**
     * @notice Returns the balance of sETH2 Tokens owned by the address `userAddress`.
     * @param userAddress : the user's unique address
     * @return uint256 : sETH2 Balance owned by `userAddress`.
     */
    function getSETH2Balance(address userAddress) external view returns (uint256);

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