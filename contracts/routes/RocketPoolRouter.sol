// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "../interfaces/IRocketPool.sol";
import "../controller-interface/IRocketController.sol";
// import "../controller-interface/IRocketERC20.sol";
import "../interfaces/RocketDepositPoolInterface.sol";
import "../controller-interface/RocketTokenRETHInterface.sol";
import "../controller-interface/RocketStorageInterface.sol";

import "hardhat/console.sol";

/** @title Router for RocketPool Strategy
@author ChainUp Dev
@dev Routes incoming data(RocketPool pre-fix) to outbound contracts 
**/
contract RocketPoolRouter is Initializable  {

    IRocketController public rocketController ;   
    RocketDepositPoolInterface  public rocketDepositPool;
    RocketTokenRETHInterface  public rocketTokenRETH ;
    RocketStorageInterface public rocketStorage  ;

    address public rocketPoolContractControllerAddress;
    // address constant public _goerliRocketStorageAddress= 0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3 ;
    // address constant public _mainnetRocketStorageAddress= 0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46 ;

    event RocketPoolDeposit(address _owner, uint rEthMinted);

    /**
    * @notice Initializes the contract by setting the required external contracts ,
    * rocketPoolControllerContract_ .   
    * @dev onlyInitializing  . 
    **/
    function __RocketPoolRouter__init( address _rocketStorageAddress , address rocketPoolControllerContract_ ) internal onlyInitializing {
        rocketStorage = RocketStorageInterface(_rocketStorageAddress);
        address rocketDepositPoolAddress = rocketStorage.getAddress(keccak256(abi.encodePacked("contract.address", "rocketDepositPool")));

        rocketDepositPool = RocketDepositPoolInterface(rocketDepositPoolAddress);
        address rocketTokenRETHAddress = rocketStorage.getAddress(keccak256(abi.encodePacked("contract.address", "rocketTokenRETH")));

        rocketTokenRETH = RocketTokenRETHInterface(rocketTokenRETHAddress);
        rocketPoolContractControllerAddress = rocketPoolControllerContract_;
        rocketController = IRocketController(rocketPoolControllerContract_);

    }

    function rocketPoolRoute(bytes calldata data) internal returns (uint256) {
        uint256 stake_amount = _rocket_deposit(data) ;
        return stake_amount;
    }

    /**
    *@dev Routes incoming data(Rocket Strategy) to outbound contracts, RocketPool Deposit Contract 
    and calls internal controller functions and also transferring of stETH to the RocketPoolController Contract
    * Requirements 
    * - `stake_amount` must be minumum 0.01 ether (minimum deposit)
    * - if the deposit to RocketPool is successful, `afterREthBalance` must be more than `beforeREthBalance`
    */
    function _rocket_deposit(bytes calldata data) internal returns (uint256) {

        uint256 beforeREthBalance = rocketTokenRETH.balanceOf(address(this) ) ;

        uint256 stake_amount = uint256(bytes32(data[32:64]));
        require(stake_amount >= 0.01 ether, "The deposited amount is less than the minimum deposit size");

        rocketDepositPool.deposit{value: stake_amount}();
        uint256 afterREthBalance = rocketTokenRETH.balanceOf(address(this) ) ;

        require(afterREthBalance > beforeREthBalance, "No rETH was minted");
        uint256 actualRethMinted =  afterREthBalance - beforeREthBalance ;
        rocketTokenRETH.transfer(rocketPoolContractControllerAddress, actualRethMinted);

        rocketController.addREthBalance(msg.sender, actualRethMinted ) ;
        emit RocketPoolDeposit(msg.sender, actualRethMinted);

        return stake_amount;
    }

}
