// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

  /**
  * @title Interface for Lido liquid staking pool
  * Pool manages withdrawal keys and fees. It receives ether submitted by users on the ETH 1 side
  * and stakes it via the deposit_contract.sol contract. It doesn't hold ether on it's balance,
  * only a small portion (buffer) of it.
  */
interface ILido {

    /** Records a deposit made by a user  */
    event Submitted(address indexed sender, uint256 amount, address referral);

    /**
    * @notice Adds eth to the pool
    * @return StETH Amount of StETH generated
    */
    function submit(address _referral) external payable returns (uint256 StETH);


    
}