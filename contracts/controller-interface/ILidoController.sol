// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface ILidoController   {
    function getReferral() external view returns (address) ;

    function addStEthShares(address userAddress, uint256 stEthBalance) external  ;

    function getStEthShares(address userAddress ) external view  returns (uint256) ;

    function addAllowList(address userAddress) external;

    function removeAllowList(address userAddress) external;

}