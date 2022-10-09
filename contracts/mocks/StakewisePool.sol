// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;

import "../controller-interface/IStakedEthToken.sol";

contract StakewisePool  {

    // @dev Amount of deposited ETH that is not considered for the activation period.
    uint256 public minActivatingDeposit = 1 wei;

    // @dev Address of the StakedEthToken contract.
    IStakedEthToken private stakedEthToken;
    /**
    * @dev Function for staking ether to the pool.
    */
    function stake() external payable {
        _stake(msg.sender, msg.value);
    }
  function _stake(address recipient, uint256 value) internal  {
        require(recipient != address(0), "Pool: invalid recipient");
        require(value > 0, "Pool: invalid deposit amount");

        // mint tokens for small deposits immediately
        // if (value <= minActivatingDeposit) {
        //     stakedEthToken.mint(recipient, value);
        //     return;
        // }
            stakedEthToken.mint(recipient, value);
            return;
    }

}