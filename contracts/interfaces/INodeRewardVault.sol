// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

  /**
  * @title Interface for NodeRewardVault
  * Vault will manage methods for rewards, commissions, tax
  */
interface INodeRewardVault {
    function nftContract() external view returns (address);

    function rewards(uint256 tokenId) external view returns (uint256);

    function recentBlockHeight() external view returns (uint256);

    function comission() external view returns (uint256);

    function tax() external view returns (uint256);

    function dao() external view returns (address);
    
    function authority() external view returns (address);

    function aggregator() external view returns (address);

    function settle() external;

    function claimRewards(uint256 tokenId) external;
}