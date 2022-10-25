// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;
import "./IMockERC20.sol";

contract STETH is IMockERC20 {
    mapping(address => uint256) public _balances;

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
         _transfer(msg.sender, recipient, amount);
         return true;
    }

    function _transfer(  address sender, address recipient,  uint256 amount ) internal virtual  {
        require(sender != address(0));
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function mint(uint256 _ethAmount, address _to) public virtual override returns (bool) {
        _balances[_to] += _ethAmount;
        return true;
    }
}
