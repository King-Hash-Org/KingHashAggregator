// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface INodeRewardVault {
    function nftContract() external view returns (address);

    function rewards(uint256 tokenId) external view returns (uint256);

    function rewardsHeight() external view returns (uint256);

    function comission() external view returns (uint256);

    function tax() external view returns (uint256);

    function dao() external view returns (address);
    
    function authority() external view returns (address);

    function aggregator() external view returns (address);

    function transfer(uint256 amount, address to) external;
}