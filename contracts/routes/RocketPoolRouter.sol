// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../controller-interface/IRocketController.sol";
import "../interfaces/RocketDepositPoolInterface.sol";
import "../controller-interface/RocketTokenRETHInterface.sol";
import "../controller-interface/RocketStorageInterface.sol";

/** @title Router for RocketPool Strategy
  * @author ChainUp Dev
  * @dev Routes incoming data(RocketPool strategy) to outbound contracts 
**/
contract RocketPoolRouter is Initializable {
    IRocketController public rocketController;
    RocketDepositPoolInterface public rocketDepositPool;
    RocketTokenRETHInterface public rocketTokenRETH;
    RocketStorageInterface public rocketStorage;

    address public rocketPoolContractControllerAddress;

    event RocketPoolDeposit(address _owner, uint256 rEthMinted);

    /**
     * @notice Initializes the contract by setting the required external contracts
     * @param  rocketStorageAddress_ - deployed rocket storage contract address
     * @param  rocketPoolControllerContract_ - deployed rocketpool controller address
     * @dev The RocketStorage contract also stores the addresses of all other network contracts,
     * therefore the rocketpool-related contracts are queried before use to prevent outdated addresses.
     **/
    function __RocketPoolRouter__init(address rocketStorageAddress_, address rocketPoolControllerContract_)
        internal
        onlyInitializing
    {
        rocketPoolContractControllerAddress = rocketPoolControllerContract_;
        rocketController = IRocketController(rocketPoolControllerContract_);
        rocketStorage = RocketStorageInterface(rocketStorageAddress_);

        address rocketDepositPoolAddress = rocketStorage.getAddress(
            keccak256(abi.encodePacked("contract.address", "rocketDepositPool"))
        );
        address rocketTokenRETHAddress = rocketStorage.getAddress(
            keccak256(abi.encodePacked("contract.address", "rocketTokenRETH"))
        );

        rocketTokenRETH = RocketTokenRETHInterface(rocketTokenRETHAddress);
        rocketDepositPool = RocketDepositPoolInterface(rocketDepositPoolAddress);
    }

    function rocketPoolRoute(bytes calldata data) internal returns (uint256) {
        return _rocket_deposit(uint256(bytes32(data[32:64])));
    }

    /**
     * @notice Routes incoming data(Rocket Strategy) to outbound contracts, RocketPool Deposit Contract
     * and calls internal controller functions and also transferring of stETH to the RocketPoolController Contract
     * @dev `stake_amount` must be minumum 0.01 ether (minimum deposit)
     * if the deposit to RocketPool is successful, `afterREthBalance` must be more than `beforeREthBalance`
     * @return stake_amount - successfully staked ether to rocketpool deposit contract
     */
    function _rocket_deposit(uint256 stake_amount) internal returns (uint256) {
        require(stake_amount >= 0.01 ether, "The deposited amount is less than the minimum deposit size");

        uint256 beforeREthBalance = rocketTokenRETH.balanceOf(address(this));
        rocketDepositPool.deposit{value: stake_amount}();
        uint256 afterREthBalance = rocketTokenRETH.balanceOf(address(this));
        require(afterREthBalance > beforeREthBalance, "No rETH was minted");
        uint256 actualRethMinted = afterREthBalance - beforeREthBalance;
        rocketTokenRETH.transfer(rocketPoolContractControllerAddress, actualRethMinted);
        rocketController.addREthBalance(msg.sender, actualRethMinted);
        emit RocketPoolDeposit(msg.sender, actualRethMinted);

        return stake_amount;
    }
}
