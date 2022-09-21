// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface ILido {
    // User functions

    /**
      * @notice Adds eth to the pool
      * @return StETH Amount of StETH generated
      */
    function submit(address _referral) external payable returns (uint256 StETH);

    // Records a deposit made by a user
    event Submitted(address indexed sender, uint256 amount, address referral);
    
}