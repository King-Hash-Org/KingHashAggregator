// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../controller-interface/IStakewiseController.sol";
import "../interfaces/IStakewise.sol";
import "../controller-interface/IStakedEthToken.sol";

/** @title Router for Stakewise Strategy
 * @author ChainUp Dev
 * @dev Routes incoming data(Stakewise strategy) to outbound contracts
 **/
contract StakewiseRouter is Initializable {
    IStakewiseController public stakewiseController;
    IStakewise public stakewiseContract;
    IStakedEthToken public iStakedEthToken;

    function __StakewiseRouter__init(
        address stakewiseContract_,
        address stakewiseController_,
        address stakedEthTokenAddress_
    ) internal onlyInitializing {
        stakewiseContract = IStakewise(stakewiseContract_);
        stakewiseController = IStakewiseController(stakewiseController_);
        iStakedEthToken = IStakedEthToken(stakedEthTokenAddress_);
    }

    function stakewiseRoute(bytes calldata data) internal returns (uint256) {
        return _stakewise_deposit(uint256(bytes32(data[32:64])));
    }

    /**
     * @notice Routes incoming data(Stakewise Strategy) to outbound contracts, Stakewise Pool Contract
     * and calls internal controller functions and also transferring of stETH to the RocketPoolController Contract
     * @dev `stake_amount` must be minumum 0.01 ether (minimum deposit)
     * if the deposit to RocketPool is successful, `afterREthBalance` must be more than `beforeREthBalance`
     * @return stake_amount - successfully staked ether to rocketpool deposit contract
     */
    function _stakewise_deposit(uint256 stake_amount) internal returns (uint256) {
      require(msg.value >= stake_amount, "Stake amount is not enough!");
      require(stake_amount >= 1 wei, "Deposit must not be zero and must be minumum 1 wei");
      uint256 beforeStakedEthBalance = iStakedEthToken.balanceOf(address(this) ) ;
      stakewiseContract.stake{ value : stake_amount }( ) ;
      uint256 afterStakedEthBalance = iStakedEthToken.balanceOf(address(this) ) ;
      uint256 actualStakedEthMinted =  afterStakedEthBalance - beforeStakedEthBalance ;
      iStakedEthToken.transfer(msg.sender, actualStakedEthMinted);
      return stake_amount;
    }
}
