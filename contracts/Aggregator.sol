// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./interfaces/IAggregator.sol";
import "./routes/ValidatorNftRouter.sol";
import "hardhat/console.sol";

/** 
 * @title Aggregator
 * @dev Implements staking aggregator for Eth
 */
//slither-disable-next-line unprotected-upgrade
contract Aggregator is IAggregator, ValidatorNftRouter, UUPSUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, OwnableUpgradeable {
    bytes1 private constant ETH32_STRATEGY = 0x01;  // 1
    bytes1 private constant LIDO_STRATEGY = 0x02; // 3
    bytes1 private constant SWELL_STRATEGY = 0x03;
    bytes1 private constant ROCKETPOOL_STRATEGY = 0x04; // 4
    bytes1 private constant STAKEWISE_STRATEGY = 0x05;
    bytes1 private constant NODE_TRADE_STRATEGY = 0x06;
    bytes1 private constant SSV_STRATEGY = 0x07; // 2
    address private kingHashLiqStaking ;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize(
        address depositContractAddress,
        address vaultAddress,
        address nftContractAddress,
        address KingHashLiqStakingAddress_,
        address chainupOperatorAddress_

    ) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __ValidatorNftRouter__init(depositContractAddress, vaultAddress, nftContractAddress, chainupOperatorAddress_);
        kingHashLiqStaking = KingHashLiqStakingAddress_;
    }

    modifier onlyKingHashLiqStaking() {
        require(kingHashLiqStaking == msg.sender, "Not allowed to transfer funds to deposit contract");
        _;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

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
                // lido route
            } else if (prefix == NODE_TRADE_STRATEGY) {
                total_ether += super.tradeRoute(data[i]);
            }
        }

        require(msg.value == total_ether, "Incorrect Ether amount provided");
        return true;
    }

    function eth32LiquidStakingRoute(bytes memory pubkey,  bytes memory withdrawalCredentials, bytes memory signature, bytes32 depositDataRoot, address operator ) external payable override nonReentrant onlyKingHashLiqStaking {
        liqStakingEth32Route(pubkey, withdrawalCredentials, signature , depositDataRoot, operator);
    }

    function unstake(bytes[] calldata data) payable external override nonReentrant whenNotPaused returns (bool) {
        return data.length == 0;
    }

    function disperseRewards(uint256 tokenId, bytes32[] memory merkleProof ) external override nonReentrant {
        rewardRoute(tokenId, merkleProof);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}