// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IRocketPool.sol";
import "../controller-interface/IRocketController.sol";
import "../controller-interface/IRocketERC20.sol";

contract RocketPoolRouter is Initializable  {

    IRocketPool public rocketPoolContract;
    IRocketController public rocketController ;   
    IRocketERC20  public iRocketERC20;
    address public rocketPoolContractControllerAddress;
    address constant public rocketETHGoerliAddress= 0x178E141a0E3b34152f73Ff610437A7bf9B83267A ; //goerli
    address constant public rocketETHMainNetAddress= 0x178E141a0E3b34152f73Ff610437A7bf9B83267A ; //goerli

    event RocketPoolDeposit(address _owner, uint rEthMinted);

    function __RocketPoolRouter__init( bool mainnet,  address rocketPoolContract_, address  rocketPoolControllerContract_  ) internal onlyInitializing {
                if (mainnet) {
                 iRocketERC20 = IRocketERC20(rocketETHMainNetAddress);
                }
                else{
                 iRocketERC20 = IRocketERC20(rocketETHGoerliAddress);
                }
        rocketPoolContract = IRocketPool(rocketPoolContract_); 
        rocketController = IRocketController(rocketPoolControllerContract_);
        rocketPoolContractControllerAddress = rocketPoolControllerContract_;
    }

    function rocketPoolRoute(bytes calldata data) internal returns (uint256) {
        uint256 stake_amount = _rocket_deposit(data) ;
        return stake_amount;
    }

    function _rocket_deposit(bytes calldata data) internal returns (uint256) {

        uint256 beforeREthBalance = iRocketERC20.balanceOf(address(this) ) ;
        uint256 stake_amount = uint256(bytes32(data[1:33]));
        require(stake_amount >= 0.01 ether, "The deposited amount is less than the minimum deposit size");

        rocketPoolContract.deposit{value: stake_amount}();
        
        uint256 afterREthBalance = iRocketERC20.balanceOf(address(this) ) ;
        //transfer to controller contract
        // require(afterREthBalance  > beforeREthBalance, "No rETH was minted");
        uint256 actualRethMinted =  afterREthBalance - beforeREthBalance ;
        iRocketERC20.transfer(rocketPoolContractControllerAddress, actualRethMinted);

        rocketController.addREthBalance(msg.sender, actualRethMinted ) ;
        emit RocketPoolDeposit(msg.sender, actualRethMinted);

        return stake_amount;
    }


}
