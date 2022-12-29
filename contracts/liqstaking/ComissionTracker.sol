// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

contract CommissionTracker {
    // The current comission rate charge on users
    uint256 public comissionRate;

    // The maximum comission rate
    uint256 public maximumComissionRate;

    // The minimum amount of commission that must be earned before a payout can be made
    uint256 public minimumPayout;

    // Mapping to keep track of the commission earned by each referrer
    mapping(address => uint256) public commission;

    // Mapping to keep track of the amount of commission paid out to each referrer
    mapping(address => uint256) public paidOut;

    constructor() {
        maximumComissionRate = 10000;
        minimumPayout = 100000;
        comissionRate = 1000;
    }

    // Function to add commission to the contract for a specific referrer
    function addCommission(address _referrer, uint256 _amount) public {
        // Add the specified amount of commission to the contract for the referrer
        commission[_referrer] += _amount;
    }

    // Function to request a commission payout for a specific referrer
    function requestPayout(address _referrer) public {
        // Check if the payout requirements are met
        require(commission[_referrer] >= minimumPayout, "Payout requirements not met");

        uint256 payoutAmount = commission[_referrer];

        // Transfer the payout amount to the referrer
        payable(_referrer).transfer(payoutAmount);

        // Update the paid out amount and reset the commission
        paidOut[_referrer] += payoutAmount;
        commission[_referrer] = 0;
    }
}
