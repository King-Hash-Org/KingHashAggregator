 // SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;
import "./IMockERC20.sol";

interface ILidoInterface {
    function submit(address _referral) external payable returns (uint256 StETH);
}


contract Lido is ILidoInterface   {
    IMockERC20 public iMockERC20;

    function setSTETHAddress(address stETHAddress_) external {
        iMockERC20 = IMockERC20(stETHAddress_);
    }

    // Records a deposit made by a user
    event Submitted(address indexed sender, uint256 amount, address referral);
 
    function submit(address _referral) override external payable returns (uint256) {
        address sender = msg.sender;
        uint256 deposit = msg.value;
        require(deposit != 0, "ZERO_DEPOSIT");
        require(sender != address(0), "MINT_TO_THE_ZERO_ADDRESS");
        // Mint stETH to user account
        iMockERC20.mint(deposit, msg.sender);
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

 }

 