// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./interfaces/IAggregator.sol";
import "./routes/ValidatorNftRouter.sol";
import "./routes/LidoRouter.sol";
import "./routes/RocketPoolRouter.sol";
import "./routes/StakewiseRouter.sol";


/** @title Staking Aggregator for Eth
  * @author ChainUp Dev
  * @dev Accepts incoming data and and route to different startegies. 
 **/
contract Aggregator is IAggregator, ValidatorNftRouter, UUPSUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, OwnableUpgradeable, LidoRouter, RocketPoolRouter, StakewiseRouter{
    bytes1 private constant ETH32_STRATEGY = 0x01;  
    bytes1 private constant LIDO_STRATEGY = 0x02; 
    bytes1 private constant SWELL_STRATEGY = 0x03;
    bytes1 private constant ROCKETPOOL_STRATEGY = 0x04; 
    bytes1 private constant STAKEWISE_STRATEGY = 0x05;
    bytes1 private constant NODE_TRADE_STRATEGY = 0x06;
    bytes1 private constant SSV_STRATEGY = 0x07; 
    bytes1 private constant ONEINCH_STRATEGY = 0x08;  

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    /**
    * @notice Initializes the contract by setting the required external
    *  contracts for different strategies (Eth32,Lido,Rocket, Stakewise)
    * ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable .  
    * @dev initializer- A modifier that defines a protected initializer function that can be invoked at most once. 
    **/
    function initialize(
        address depositContractAddress,
        address vaultAddress,
        address nftContractAddress,
        address lidoContractAddress,
        address lidoControllerContractAddress,
        address rocketStorageAddressContractAddress,
        address rocketPoolControllerContractAddress, 
        address stakewiseContractAddress,
        address stakewiseControllerAddress,
        address stakedEthTokenAddressAddress
    ) 
    external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __ValidatorNftRouter__init(depositContractAddress, vaultAddress, nftContractAddress);
        __LidoRouter__init(lidoContractAddress, lidoControllerContractAddress);
        __RocketPoolRouter__init( rocketStorageAddressContractAddress, rocketPoolControllerContractAddress );
        __StakewiseRouter__init(stakewiseContractAddress, stakewiseControllerAddress, stakedEthTokenAddressAddress ) ; 
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
    * @dev See {IAggregator-stake}.
    */
    function stake(bytes[] calldata data) payable external override nonReentrant whenNotPaused returns (bool) {
        uint256 total_ether = 0;

        for (uint256 i = 0; i < data.length; i++) {
            require(data[i].length > 0, "Empty data provided");
            bytes1 prefix = bytes1(data[i][0]);
            if (prefix == ETH32_STRATEGY) {
                require(data[i].length == 320 , "Eth32 Contract: Invalid Data Length");
                super.eth32Route(data[i]);
                total_ether += 32 ether;
            } else if (prefix == LIDO_STRATEGY) {
                require(data[i].length == 64, "LidoContract: invalid data.length");
                total_ether += super.lidoRoute(data[i]);
            } else if (prefix == ROCKETPOOL_STRATEGY) {
                require(data[i].length == 64, "Rocket Pool Contract: invalid data.length");
                total_ether += super.rocketPoolRoute(data[i]);
            }
            else if (prefix == STAKEWISE_STRATEGY) {
                require(data[i].length == 64, "Stakewise Contract: invalid data.length");
                total_ether += super.stakewiseRoute(data[i]);
            }
            
             else if (prefix == NODE_TRADE_STRATEGY) {
                total_ether += super.tradeRoute(data[i]);
            }
        }
        require(msg.value == total_ether, "Incorrect Ether amount provided");
        return true;
    }

    /**
    * @dev See {IAggregator-unstake}.
    */
    function unstake(bytes[] calldata data) payable external override nonReentrant whenNotPaused returns (bool) {
        return data.length == 0;
    }

    /**
    * @dev See {IAggregator-disperseRewards}.
    */
    function disperseRewards(uint256 tokenId) external override {
        require(msg.sender == nftAddress, "Message sender is not the Nft contract");
        rewardRoute(tokenId);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}