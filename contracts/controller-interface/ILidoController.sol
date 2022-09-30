// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface ILidoController   {
    /**
     * @dev Returns a string, `referral`.
     * Requirements:
     * - `referral` must exist.
     */
    function getReferral() external view returns (address) ;

    /**
     * @dev Adds `stEthShares` shares to `stEthSharesMap` that keep tracks of stETH shares owned by each address `.
     * Requirements:
     * - `userAddress` must exist.
     * - `msg.sender` must be under list of allowed addresses, `allowList`. 
     */
    function addStEthShares(address userAddress, uint256 stEthShares) external  ;

    /**
     * @dev Returns the number of stETH shares, `stEthBalance` owned by the address `userAddress`.
     * @param userAddress : the user's unique address
     * Requirements:
     * - `userAddress` must exist 
    * @return uint256 : the number of stETH shares owned by `userAddress`.
     */
    function getStEthShares(address userAddress ) external view  returns (uint256) ;

    /**
    * @dev Adds `userAddress` to a list of allowed address, `allowList`
    * onlyOwner- modifier which will only allow use of function to the owner.
    * @param userAddress : the user's unique address
    */
    function addAllowList(address userAddress) external;

    /**
    * @dev Remove `userAddress` from a list of allowed address, `allowList`.
    * onlyOwner- modifier which will only allow use of function to the owner.
    * @param userAddress : the user's unique address
    */
    function removeAllowList(address userAddress) external;

}