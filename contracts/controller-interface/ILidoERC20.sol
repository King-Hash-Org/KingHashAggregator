// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface ILidoERC20 {

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    
     /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     * Returns a boolean value indicating whether the operation succeeded.
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

}