// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BeaconOracle is OwnableUpgradeable {
    // Eth2 Validator Rewards
    uint256 public validatorRewards;

    // Callback function
    event setValidatorRewardSuccess();

    function initialize() external initializer {
        __Ownable_init();
    }

    function setValidatorRewards(uint256 rewards) public onlyOwner {
        // If it isn't sent by a trusted oracle
        // a.k.a ourselves, ignore it
        validatorRewards = rewards;
        emit setValidatorRewardSuccess();
    }

    function getValidatorRewards() public view returns (uint256) {
        return validatorRewards;
    }
}
