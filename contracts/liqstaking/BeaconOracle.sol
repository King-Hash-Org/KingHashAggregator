// SPDX-License-Identifier: MIT

// This code has not been professionally audited, therefore I cannot make any promises about
// safety or correctness. Use at own risk.
import "../libraries/UnstructuredStorage.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./KingHashOperators.sol";
import "./IKingHash.sol";

pragma solidity >=0.8.7;

contract BeaconOracle is Initializable, UUPSUpgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using UnstructuredStorage for bytes32;

    bytes32 internal constant EXPECTED_EPOCH_POSITION = keccak256("KingHash.BeaconOracle.expectedEpoch"); 
    uint128 internal constant DENOMINATION_OFFSET = 1e9;
    uint64 internal constant EPOCHS_PER_FRAME = 225;
    uint64 internal constant SLOTS_PER_EPOCH = 32;
    uint64 internal constant GENESIS_TIME = 1606824023;
    uint64 internal constant SECONDS_PER_SLOT = 12;

    address public kinghashContract;

    mapping(uint256 => mapping(bytes32 => uint256)) internal submittedReports;
    mapping(uint256 => mapping(address => bool)) internal hasSubmitted;

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function initalizeOracle(address _kinghash) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        kinghashContract = _kinghash;
        EXPECTED_EPOCH_POSITION.setStorageUint256(_getFirstEpochOfDay(_getCurrentEpochId()) + EPOCHS_PER_FRAME);
    }
    
    function _getFirstEpochOfDay(uint256 _epochId) internal pure returns (uint256) {
        return (_epochId / EPOCHS_PER_FRAME) * EPOCHS_PER_FRAME;
    }

    function _getCurrentEpochId() internal view returns (uint256) {
        return (_getTime() - GENESIS_TIME) / (SLOTS_PER_EPOCH * SECONDS_PER_SLOT);
    }

    function _getTime() internal view returns (uint256) {
        return block.timestamp;  
    }

    function reportBeacon(uint256 epochId, uint256 data, bytes32 nodeRankingCommitment) external {
        require(getKingHash().isValidOperator(msg.sender), "Not part of KingHash DAOs' trusted list of addresses");
        require(epochId == EXPECTED_EPOCH_POSITION.getStorageUint256(), "The epoch submitted is not expected.");
        require(hasSubmitted[epochId][msg.sender]== false , "This msg.sender has already submitted the vote.");

        bytes32 hash = keccak256(abi.encode(data, nodeRankingCommitment));
        submittedReports[epochId][hash]++;

        hasSubmitted[epochId][msg.sender] = true;
        
        uint256 quorum = getQuorum();    
        if (submittedReports[epochId][hash] > quorum) {
            pushReport(data, nodeRankingCommitment);
        }
    }

    function getQuorum() internal  returns(uint256) {
        IKingHash kinghash = getKingHash();
        uint256 n = kinghash.getNodeOperatorCount() * 2 / 3;  
        return  1 + n;
    }

    function pushReport(uint256 data, bytes32 nodeRankingCommitment) internal {
        IKingHash kinghash = getKingHash();
        kinghash.handleOracleReport(data, nodeRankingCommitment);
        uint256 nextExpectedEpoch =  EXPECTED_EPOCH_POSITION.getStorageUint256() + EPOCHS_PER_FRAME;
        EXPECTED_EPOCH_POSITION.setStorageUint256(nextExpectedEpoch) ; 
    }

    function resetEpectedEpoch() external onlyOwner {
        require(getKingHash().isValidOperator(msg.sender), "Not part of KingHash DAOs' trusted list of addresses");

        EXPECTED_EPOCH_POSITION.setStorageUint256(_getFirstEpochOfDay(_getCurrentEpochId()) + EPOCHS_PER_FRAME);
    }

    function getKingHash() public view returns (IKingHash) {
        return IKingHash(kinghashContract);
    }

    function getExpectedEpochPosition() public view returns (uint256) {
        return EXPECTED_EPOCH_POSITION.getStorageUint256();
    }
}
