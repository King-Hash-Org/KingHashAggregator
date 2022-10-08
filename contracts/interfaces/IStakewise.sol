// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

 /**
 * @dev Interface of the Pool contract.
 */
interface IStakewise {
   /**
    * @dev Function for staking ether to the pool.
    */
    function stake() external payable;

}