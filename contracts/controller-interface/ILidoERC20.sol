// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface ILidoERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    function transfer(address to, uint256 amount) external returns (bool);

}