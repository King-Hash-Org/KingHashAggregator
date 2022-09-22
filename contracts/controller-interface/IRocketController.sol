// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface IRocketController   {

    function addREthBalance(address userAddress, uint256 rEthBalance) external  ;

    function getREthBalance(address userAddress ) external view  returns (uint256) ;

    function addAllowList(address userAddress) external;

    function removeAllowList(address userAddress) external;
}