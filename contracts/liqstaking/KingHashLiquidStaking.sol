// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../interfaces/IDepositContract.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./KingHashOperators.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IKingHashRewardsVault.sol";
import "./IKingHash.sol";
import "../libraries/SafeMath.sol";
import "../libraries/UnstructuredStorage.sol";
import "../interfaces/IAggregator.sol";
import "../interfaces/IValidatorNft.sol";
import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract KingHashLiquidStaking is
    Initializable,
    ERC20Upgradeable,
    KingHashOperators,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    ERC721A__IERC721ReceiverUpgradeable,
    PausableUpgradeable
{
    using SafeMath for uint256;
    using UnstructuredStorage for bytes32;

    // Events
    // event DepositReceived(address indexed from, uint256 amount, uint256 time, address indexed _referral);
    // event ReferralSubmitted(address indexed _referral , uint256 amount, uint256 time);
    event DepositReceived(address indexed from, uint256 amount, address indexed _referral);
    event ELRewardsReceived(uint256 balance);
    event EtherDeposited(address from, uint256 balance, uint256 height);

    bytes32 internal constant ORACLE_POSITION = keccak256("KingHash.oracle");
    bytes32 internal constant BEACON_BALANCE_POSITION = keccak256("KingHash.beaconBalance");
    bytes32 internal constant TOTAL_BEACON_VALIDATORS = keccak256("KingHash.beaconValidators");
    /// @dev number of deposited validators (incrementing counter of deposit operations).
    bytes32 internal constant DEPOSITED_VALIDATORS_POSITION = keccak256("KingHash.depositedValidators");
    /// @dev number of KingHash Beacon's validators available in the Beacon state
    bytes32 internal constant BEACON_VALIDATORS_POSITION = keccak256("KingHash.beaconValidators");
    bytes32 internal constant BUFFERED_ETHER_POSITION = keccak256("KingHash.bufferedEther");
    bytes32 internal constant EL_REWARDS_WITHDRAWAL_LIMIT_POSITION = keccak256("kinghash.ELRewardsWithdrawalLimit");
    bytes32 internal constant EL_REWARDS_VAULT_POSITION = keccak256("KingHash.kinghashRewardsVault");
    bytes32 internal constant TOTAL_EL_REWARDS_COLLECTED_POSITION = keccak256("kinghash.ELRewardsCollectedPosition");

    bytes32 internal constant TREASURY_FEE_POSITION = keccak256("KingHash.liquidstaking.treasuryFee");
    bytes32 internal constant PROTOCOL_FEE_POSITION = keccak256("KingHash.liquidstaking.insuranceFee");
    bytes32 internal constant NODE_OPERATORS_FEE_POSITION = keccak256("KingHash.liquidstaking.nodeOperatorsFee");
    bytes32 internal constant TREASURY_POSITION = keccak256("KingHash.liquidstaking.treasury");
    bytes32 internal constant REFERRAL_FEE_POSITION = keccak256("KingHash.referralFee");
    bytes32 internal constant NODE_RANKING_COMMITMENT = keccak256("KingHash.nodeRankingCommitment");

    uint256 public constant DEPOSIT_SIZE = 32 ether;
    uint256 public constant PUBKEY_LENGTH = 48;
    uint256 public constant WITHDRAWAL_CREDENTIALS_LENGTH = 32;
    uint256 public constant SIGNATURE_LENGTH = 96;
    uint256 public constant TOTAL_BASIS_POINTS = 10000;
    uint256 public constant DEPOSIT_FEE_RATE = 5;
    uint256 public constant TOTAL_DEPOSIT_FEE = 9995;

    bytes internal withdrawalCredentials;
    IAggregator internal aggregator;
    IValidatorNft internal nftContract;

    function initLiqStakingVault(
        bytes memory withdrawalCreds,
        address _aggregator,
        address _validatorNft
    ) external initializer {
        // require(_oracle != address(0), "ORACLE_ZERO_ADDRESS");
        // require(_kingHashRewardsVault != address(0), "REWARDS_VAULT_ADDRESS");
        aggregator = IAggregator(_aggregator);
        __Operators__init();
        __ReentrancyGuard_init();
        __ERC20_init("kETH", "King Ether");
        // _mint(_msgSender(), 10000000000000000000000);
        // addTotalETHBalance(10000000000000000000000);
        withdrawalCredentials = withdrawalCreds;
        BUFFERED_ETHER_POSITION.setStorageUint256(0);

        // ORACLE_POSITION.setStorageAddress(_oracle);
        // EL_REWARDS_VAULT_POSITION.setStorageAddress(_kingHashRewardsVault);
        EL_REWARDS_WITHDRAWAL_LIMIT_POSITION.setStorageUint256(2 ether);
        DEPOSITED_VALIDATORS_POSITION.setStorageUint256(0);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function stake(address referral, address node_operator) external payable nonReentrant {
        require(msg.value != 0, "Stake amount must not be Zero");
        require(msg.value >= 100 wei, "Stake amount must be minimum  100 wei");
        require(referral != address(0x0), "Referral address must be provided");

        if (node_operator == address(0)) {
            node_operator = getChainUp();
        }
        require(_isValidOperator(node_operator), "Node operator must be approved");

        uint256 depositNet = TOTAL_DEPOSIT_FEE.mul(msg.value).div(TOTAL_BASIS_POINTS);
        BUFFERED_ETHER_POSITION.setStorageUint256(_getBufferedEther().add(depositNet));
        addToOperatorBalance(node_operator, depositNet);
        _mintKETH(msg.sender, depositNet);

        emit DepositReceived(msg.sender, msg.value, referral);
    }

    //whenNotStopped
    function _mintKETH(address _recipient, uint256 _ethAmount) internal {
        require(_recipient != address(0), "MINT_TO_THE_ZERO_ADDRESS");
        _mint(_recipient, getKethValue(_ethAmount));
    }

    // Calculate the amount of ETH backing an amount of kETH
    function getEthValue(uint256 _kethAmount) public view returns (uint256) {
        uint256 kEthSupply = totalSupply();
        if (kEthSupply == 0) {
            // Use 1:1 ratio if no kETH is minted
            return _kethAmount;
        }

        uint256 totalEthBalance = _getTotalPooledEther();
        return (_kethAmount * totalEthBalance) / (kEthSupply);
    }

    function getKethValue(uint256 _ethAmount) public view returns (uint256) {
        uint256 kEthSupply = totalSupply();
        if (kEthSupply == 0) {
            // Use 1:1 ratio if no kETH is minted
            return _ethAmount;
        }

        uint256 totalEthBalance = _getTotalPooledEther();
        require(totalEthBalance > 0, "Cannot calculate kETH token amount while total network balance is zero");
        return (_ethAmount * kEthSupply) / totalEthBalance;
    }

    function registerValidator(
        bytes memory pubkey,
        bytes memory signature,
        bytes32 depositDataRoot
    ) external nonReentrant {
        require(_isValidOperator(msg.sender), "The message sender is not part of KingHash Operators");
        require(operatorBalance(msg.sender) > DEPOSIT_SIZE, "The pool has less than 32 Eth");

        subtractFromOperatorBalance(msg.sender, DEPOSIT_SIZE);
        BUFFERED_ETHER_POSITION.setStorageUint256(_getBufferedEther().sub(DEPOSIT_SIZE));
        DEPOSITED_VALIDATORS_POSITION.setStorageUint256(DEPOSITED_VALIDATORS_POSITION.getStorageUint256().add(1));

        aggregator.liquidStake{value: DEPOSIT_SIZE}(
            pubkey,
            withdrawalCredentials,
            signature,
            depositDataRoot,
            msg.sender
        );
    }

    function batchRegisterValidator(
        bytes[] memory pubkey,
        bytes[] memory signature,
        bytes32[] memory depositDataRoot
    ) external nonReentrant {
        require(operatorBalance(msg.sender) > DEPOSIT_SIZE * pubkey.length, "The operator pool has insufficient Ether");

        for (uint256 i = 0; i < pubkey.length; i++) {
            subtractFromOperatorBalance(msg.sender, DEPOSIT_SIZE);
            BUFFERED_ETHER_POSITION.setStorageUint256(_getBufferedEther().sub(DEPOSIT_SIZE));
            DEPOSITED_VALIDATORS_POSITION.setStorageUint256(DEPOSITED_VALIDATORS_POSITION.getStorageUint256().add(1));
            aggregator.liquidStake{value: DEPOSIT_SIZE}(
                pubkey[i],
                withdrawalCredentials,
                signature[i],
                depositDataRoot[i],
                msg.sender
            );
        }
    }

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external override returns (bytes4) {
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

    function getOracle() public view returns (address) {
        return ORACLE_POSITION.getStorageAddress();
    }

    function getBeaconBalance() public view returns (uint256) {
        return BEACON_BALANCE_POSITION.getStorageUint256();
    }

    function getTotalBeaconValidators() public view returns (uint256) {
        return TOTAL_BEACON_VALIDATORS.getStorageUint256();
    }

    function getELRewardsVault() public view returns (address) {
        return EL_REWARDS_VAULT_POSITION.getStorageAddress();
    }

    function _getBufferedEther() internal view returns (uint256) {
        uint256 buffered = BUFFERED_ETHER_POSITION.getStorageUint256();
        return buffered;
    }

    function _getTransientBalance() internal view returns (uint256) {
        uint256 depositedValidators = DEPOSITED_VALIDATORS_POSITION.getStorageUint256();
        uint256 beaconValidators = BEACON_VALIDATORS_POSITION.getStorageUint256();
        // beaconValidators can never be less than deposited ones.
        assert(depositedValidators >= beaconValidators);
        return depositedValidators.sub(beaconValidators).mul(DEPOSIT_SIZE);
    }

    function _getTotalPooledEther() internal view returns (uint256) {
        return _getBufferedEther().add(
            BEACON_BALANCE_POSITION.getStorageUint256()
        ).add(_getTransientBalance());
    }

    function getNodeOperatorCount() external view returns (uint256) {
        return totalOperatorCount;
    }

    function handleOracleReport(uint256 data, bytes32 nodeRankingCommitment) external {
        require(msg.sender == getOracle(), "APP_AUTH_FAILED");
        (uint256 _beaconBalance, uint256 _beaconValidators) = decode(data);
        uint256 depositedValidators = DEPOSITED_VALIDATORS_POSITION.getStorageUint256();
        require(_beaconValidators <= depositedValidators, "REPORTED_MORE_DEPOSITED");

        uint256 beaconValidators = BEACON_VALIDATORS_POSITION.getStorageUint256();
        require(_beaconValidators >= beaconValidators, "REPORTED_LESS_VALIDATORS");
        uint256 appearedValidators = _beaconValidators.sub(beaconValidators);
        uint256 rewardBase = (appearedValidators.mul(DEPOSIT_SIZE)).add(BEACON_BALANCE_POSITION.getStorageUint256());

        BEACON_BALANCE_POSITION.setStorageUint256(_beaconBalance);
        BEACON_VALIDATORS_POSITION.setStorageUint256(_beaconValidators);
        NODE_RANKING_COMMITMENT.setStorageBytes32(nodeRankingCommitment); // overwrite with new merkle root of node ranking



        // here change logic
        uint256 executionLayerRewards;
        address executionLayerRewardsVaultAddress = getELRewardsVault();

        //charge 7 , 3 % , getter setter for this rewwards ratio.
        if (executionLayerRewardsVaultAddress != address(0)) {
            executionLayerRewards = IKingHashRewardsVault(executionLayerRewardsVaultAddress).withdrawRewards(
                EL_REWARDS_WITHDRAWAL_LIMIT_POSITION.getStorageUint256()
            );

            if (executionLayerRewards != 0) {
                BUFFERED_ETHER_POSITION.setStorageUint256(_getBufferedEther().add(executionLayerRewards));
            }
        }

        if (_beaconBalance > rewardBase) {
            // to distribute rewards - oraclereport must be profitable
            uint256 rewards = _beaconBalance.sub(rewardBase);
            // mint as kETH
            // distributeFee(rewards); // add (executionLayerRewards)
        }
    }

    function computeELRewards() internal returns (uint256) {
        return 0;
    }

    function decode(uint256 input) public pure returns (uint256 beaconBalance, uint256 beaconValidators) {
        beaconBalance = input >> 8;
        beaconValidators = input & 0xff;
    }

    function receiveELRewards() external payable {
        require(msg.sender == EL_REWARDS_VAULT_POSITION.getStorageAddress());

        TOTAL_EL_REWARDS_COLLECTED_POSITION.setStorageUint256(
            TOTAL_EL_REWARDS_COLLECTED_POSITION.getStorageUint256().add(msg.value)
        );

        emit ELRewardsReceived(msg.value);
    }

    function getName() public view returns (string memory) {
        return name();
    }

    // Receive an ETH deposit from a minipool or generous individual
    receive() external payable {
        // Emit ether deposited event
        emit EtherDeposited(msg.sender, msg.value, block.timestamp);
    }
}
