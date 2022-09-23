 // SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;
import "hardhat/console.sol";
// import "../controller-interface/IERC20.sol";

interface ILidoInterface {
    function submit(address _referral) external payable returns (uint256 StETH);
}

interface IERC20x {
    event Transfer(address indexed from, address indexed to, uint256 value);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract Lido is ILidoInterface , IERC20x  {
        // Records a deposit made by a user
    event Submitted(address indexed sender, uint256 amount, address referral);
 
    function submit(address _referral) override external payable returns (uint256) {
        address sender = msg.sender;
        uint256 deposit = msg.value;
        require(deposit != 0, "ZERO_DEPOSIT");
        require(sender != address(0), "MINT_TO_THE_ZERO_ADDRESS");
        uint256 sharesAmount = getSharesByPooledEth(deposit);
         _submitted(sender, deposit, _referral);
        return sharesAmount;
    }

     function getSharesByPooledEth(uint256 deposit) internal pure returns (uint256) { 
      return deposit ; 
    }

    function _submitted(address _sender, uint256 _value, address _referral) internal {
        emit Submitted(_sender, _value, _referral);
    }
    function transfer(address to, uint256 value) override public returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }
        function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0));
        emit Transfer(from, to, value);
    }

 }

 