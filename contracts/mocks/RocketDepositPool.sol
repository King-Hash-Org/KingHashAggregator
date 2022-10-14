
// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;
import "./IMockERC20.sol";

interface IRocketDepositPool {
    function deposit() external payable;
}

contract RocketDepositPool is IRocketDepositPool {
    // Events
    event DepositReceived(address indexed from, uint256 amount, uint256 time);
    IMockERC20 public iMockERC20;

    function setRocketAddress(address rocketETHAddress_) external {
        iMockERC20 = IMockERC20(rocketETHAddress_);
    }

    // Accept a deposit from a user
    function deposit() external payable override {
        // Check deposit amount

        require(msg.value >= 0.01 ether, "The deposited amount is less than the minimum deposit size");
        require(msg.value % 1 gwei == 0, "DepositContract: deposit value not multiple of gwei");

        //  Calculate deposit fee
        uint256 depositFee = 0 wei;
        uint256 depositNet = msg.value - depositFee;

        // // Mint rETH to user account
        iMockERC20.mint(depositNet, msg.sender);

        //  Emit deposit received event
        emit DepositReceived(msg.sender, msg.value, block.timestamp);
    }
}
