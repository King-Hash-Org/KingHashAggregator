// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "../interfaces/ILido.sol";
import "../controller-interface/ILidoController.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";
import "../controller-interface/ILidoERC20.sol";

/** @title Router for Lido Strategy
@author ChainUp Dev
@dev Routes incoming data(Lido pre-fix) to outbound contracts 
**/
contract LidoRouter is Initializable {

    ILido public lidoContract;
    ILidoController public lidoController ;   
    ILidoERC20  public iLidoERC20;
    address public lidoContractControllerAddress;

    event LidoDeposit(address _owner, uint256 _stake_amount);

    /**
    * @notice Initializes the contract by setting the required external contracts ,
    * lidoContract_, lidoControllerContract_ .   
    * @dev onlyInitializing  . 
    **/
    function __LidoRouter__init( address lidoContract_, address lidoControllerContract_ ) internal onlyInitializing {
        lidoContract = ILido(lidoContract_); 
        lidoController = ILidoController(lidoControllerContract_);
        iLidoERC20 = ILidoERC20(lidoContract_);
        lidoContractControllerAddress = lidoControllerContract_;
    }

    function lidoRoute(bytes calldata data) internal returns (uint256) {
        uint256 stake_amount = _lido_stake(data) ;
        return stake_amount;
    }

    /**
    *@dev Routes incoming data (Lido Strategy) to outbound contracts, Lido Staking Contract for the staking function
    and calls the controller function like adding to stETH shares and also transferring of stETH to the controller address
    * Requirements 
    * -msg.value has to be more than `stake_amount` 
    * -stake_amount must be minumum 1 wei (minimum deposit)` 
    */
    function _lido_stake(bytes calldata data) internal  returns (uint256) {
        uint256 stake_amount = uint256(bytes32(data[32:64]));

        require(msg.value >= stake_amount, "Stake amount is not enough!");
        require(stake_amount >= 1 wei, "Deposit must not be zero or must be minumum 1 wei");
        uint256 shareAmount = lidoContract.submit{value: stake_amount}( lidoController.getReferral() );
        //transfer this share amount to controller contract
        // require(lidoContractControllerAddress != address(0) ,"lidoController address cannot be empty") ;
        iLidoERC20.transfer(lidoContractControllerAddress , shareAmount);

        lidoController.addStEthShares(msg.sender, shareAmount ) ;
        emit LidoDeposit(msg.sender, stake_amount);

        return stake_amount;
    }

}
