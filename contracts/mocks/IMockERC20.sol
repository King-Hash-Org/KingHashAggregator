// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;

interface IMockERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    function mint(uint256 _ethAmount, address _to) external returns (bool);

}
