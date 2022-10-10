// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/INodeRewardVault.sol";
import "./interfaces/IValidatorNft.sol";

contract NodeRewardVault is INodeRewardVault, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    IValidatorNft private _nftContract;

    uint256 private _comission;
    uint256 private _tax;
    address private _dao;
    address private _authority;
    address private _nftContractAddress;

    struct SettleMetadata {
        uint256 blockNumber; 
        uint256 settleRewards;
        uint256 totalValidatorNumber;
        uint256 totalGasHeight;
    }

    SettleMetadata[] public _settleMetadata;
    uint256 public _settleBlockLimit = 216000;
    uint256 public _totalSettleRewards = 0;
    uint256[] public _blockRewards;

    // bool private _isSettleStart = false;
    // uint256 private _settleRewards = 0;
    // uint256 private _settleBlockNumber = 0;
    // uint256 private _settleIndex = 0;

    event ComissionChanged(uint256 _before, uint256 _after);
    event TaxChanged(uint256 _before, uint256 _after);
    event DaoChanged(address _before, address _after);
    event AuthorityChanged(address _before, address _after);
    event AggregatorChanged(address _before, address _after);
    event RewardClaimed(address _owner, uint256 _amount, uint256 _total);
    event Transferred(address _to, uint256 _amount);
    event Settle(uint256 _blockNumber, uint256 _settleRewards);

    modifier onlyNftContract() {
        require(_nftContractAddress == msg.sender, "Not allowed to touch funds");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize(address nftContract_) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _nftContract = IValidatorNft(nftContract_);
        _nftContractAddress = address(nftContract_);
        _dao = address(0xd17a3B462170c53592a165Dfd007c7ED2b84F956);
        _authority = address(0xF5ade6B61BA60B8B82566Af0dfca982169a470Dc);
        _comission = 1000;
        _tax = 0;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function settle() external {
        if (_settleMetadata.length != 0) {
            SettleMetadata memory lastSettle = _settleMetadata[_settleMetadata.length-1];
            require(lastSettle.blockNumber+_settleBlockLimit > block.number, "settle interval is too short");
        }

        uint256 _settleBlockNumber = block.number;
        uint256 _settleRewards = address(this).balance - _totalSettleRewards;
        uint256 _totalValidatorNumber = _nftContract.activeValidators().length;
        uint256 _totalGasHeight = _nftContract.totalHeight();

        SettleMetadata memory newSettle = SettleMetadata({
            blockNumber: _settleBlockNumber,
            settleRewards: _settleRewards,
            totalValidatorNumber: _totalValidatorNumber,
            totalGasHeight: _totalGasHeight
        });
       
       _settleMetadata.push(newSettle);

        uint256 total = _totalValidatorNumber * _settleBlockNumber - _totalGasHeight;
        _blockRewards.push(_settleRewards/total);

        emit Settle(_settleBlockNumber, _settleRewards);
    }

    function withdrawReward(uint256 tokenId) external override {
        address owner = _nftContract.ownerOf(tokenId);
        (uint256 nftRewards, uint256 settleBlockNumber_) = _rewards(tokenId);
        if (nftRewards == 0) {
            return;
        }

        // update nft gasHeight
        _nftContract.updateHeight(tokenId, settleBlockNumber_);
        _totalSettleRewards = _totalSettleRewards - nftRewards;

        uint256 userReward = ((10000 - _comission) * nftRewards) / 10000;
        transfer(userReward, owner);
        if (nftRewards > userReward) {
            transfer(nftRewards - userReward, _dao);
        }

        emit RewardClaimed(owner, userReward, nftRewards);
    }

    function rewards(uint256 tokenId) external view override returns (uint256) {
        (uint256 nftRewards, ) = _rewards(tokenId);
        return nftRewards ;
    }

    function _rewards(uint256 tokenId) private view returns (uint256, uint256) {
        uint256 gasHeight_ = _nftContract.gasHeightOf(tokenId);
        uint256 totalReward_ = 0;
        uint256 start_ = 0;
        uint256 settleBlockNumber_ = 0;
        for (uint256 i = 0; i < _settleMetadata.length; i++) {
            SettleMetadata memory settleMetadata_ = _settleMetadata[i];
            if (gasHeight_ > settleMetadata_.blockNumber) {
                continue;
            }
            if (i+1 >= _settleMetadata.length) {
                break;
            }

            SettleMetadata memory nextSettleMetadata_ = _settleMetadata[i];
            if (start_ == 0 ) {
                start_ = gasHeight_;
            } else {
                start_ = settleMetadata_.blockNumber;
            }
            uint256 end_ = nextSettleMetadata_.blockNumber;
            settleBlockNumber_ = end_;
            totalReward_ = totalReward_ + _calcRewards(start_, end_, nextSettleMetadata_);
        }

        return (totalReward_, settleBlockNumber_);
    }


    function _calcRewards(uint256 start_, uint256 end_, SettleMetadata memory settleMetadata_) private view returns (uint256) {
        uint256 total = settleMetadata_.totalValidatorNumber * settleMetadata_.blockNumber - settleMetadata_.totalGasHeight;
        return settleMetadata_.settleRewards * (end_ - start_) / total;
    }

    function blockRewards() external view override returns (uint256) {
        uint256 totalBlockRewards = 0;
        for (uint256 i = 0; i < _blockRewards.length; i++) {
            totalBlockRewards = totalBlockRewards + _blockRewards[i];
        }

        return totalBlockRewards / _blockRewards.length;
    }

    function comission() external view override returns (uint256) {
        return _comission;
    }

    function tax() external view override returns (uint256) {
        return _tax;
    }

    function dao() external view override returns (address) {
        return _dao;
    }

    function authority() external view override returns (address) {
        return _authority;
    }

    function nftContract() external view override returns (address) {
        return _nftContractAddress;
    }

    function transfer(uint256 amount, address to) private {
        require(to != address(0), "Recipient address provided invalid");
        payable(to).transfer(amount);
        emit Transferred(to, amount);
    }

    function setComission(uint256 comission_) external onlyOwner {
        require(comission_ < 10000, "Comission cannot be 100%");
        emit ComissionChanged(_comission, comission_);
        _comission = comission_;
    }

    function setTax(uint256 tax_) external onlyOwner {
        require(tax_ < 10000, "Tax cannot be 100%");
        emit TaxChanged(_tax, tax_);
        _tax = tax_;
    }

    function setDao(address dao_) external onlyOwner {
        require(dao_ != address(0), "DAO address provided invalid");
        emit DaoChanged(_dao, dao_);
        _dao = dao_;
    }

    function setAuthority(address authority_) external onlyOwner {
        require(authority_ != address(0), "Authority address provided invalid");
        emit AuthorityChanged(_authority, authority_);
        _authority = authority_;
    }

    receive() external payable {}
}