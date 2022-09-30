// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface IRocketController   {
    /**
    * @notice Adds `rEthBalance` shares to `rEthBalanceMap` that keep tracks of RETH Tokens owned by each address.
    * @param userAddress : the user's unique address.
    * @param rEthBalance : rETH Tokens owned.
    * @dev `userAddress` cannot be the zero address, `msg.sender` must be inside list of allowed addresses. 
    */
    function addREthBalance(address userAddress, uint256 rEthBalance) external  ;

    /**
    * @notice Returns the balance of RETH Tokens owned by the address `userAddress`.
    * @param userAddress : the user's unique address
    * @return uint256 : REth Balance owned by `userAddress`.
     */
    function getREthBalance(address userAddress ) external view  returns (uint256) ;

    /**
    * @dev Adds `userAddress` to a list of allowed address, `allowList`.
    * @param userAddress : the user's unique address
    * @dev onlyOwner will only allow use of function to the owner.
    */
    function addAllowList(address userAddress) external;

    /**
    * @dev Remove `userAddress` from a list of allowed address, `allowList`.
    * @param userAddress : the user's unique address
    * @dev onlyOwner will only allow use of function to the owner.
    */
    function removeAllowList(address userAddress) external;
}