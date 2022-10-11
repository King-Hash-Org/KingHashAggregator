// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/INodeRewardVault.sol";
import "./interfaces/IValidatorNft.sol";
import "hardhat/console.sol";

contract NodeRewardVault is INodeRewardVault, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    IValidatorNft private _nftContract;

    struct RewardMetadata {
        uint256 rewardPerGasHeight;
        uint256 blockHeight;
    }

    RewardMetadata[] public rewardsMeta;
    uint256 public _settleBlockLimit = 1;
    uint256 public settledRewards = 0;
    uint256 public prevTotalHeight = 0;
    uint256 public offset = 0;

    uint256 private _comission;
    uint256 private _tax;
    address private _dao;
    address private _authority;
    address private _aggregatorProxyAddress;

    event ComissionChanged(uint256 _before, uint256 _after);
    event TaxChanged(uint256 _before, uint256 _after);
    event DaoChanged(address _before, address _after);
    event AuthorityChanged(address _before, address _after);
    event AggregatorChanged(address _before, address _after);
    event RewardClaimed(address _owner, uint256 _amount);
    event Transferred(address _to, uint256 _amount);
    event Settle(uint256 _blockNumber, uint256 _settleRewards);

    modifier onlyAggregator() {
        require(_aggregatorProxyAddress == msg.sender, "Not allowed to touch funds");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize(address nftContract_) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _nftContract = IValidatorNft(nftContract_);
        _aggregatorProxyAddress = address(0x1);
        _dao = address(0xd17a3B462170c53592a165Dfd007c7ED2b84F956);
        _authority = address(0xF5ade6B61BA60B8B82566Af0dfca982169a470Dc);
        _comission = 1000;
        _tax = 0;

        RewardMetadata memory r = RewardMetadata({
            rewardPerGasHeight: 0,
            blockHeight: block.number
        });
        rewardsMeta.push(r);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _rewards(uint256 tokenId) private view returns (uint256) {
        uint256 gasHeight_ = _nftContract.gasHeightOf(tokenId);
        uint256 totalReward_ = 0;
        uint256 start_ = 0;
        uint256 end_ = 0;
        for (uint256 i = 0; i < rewardsMeta.length; i++) {
            RewardMetadata memory r = rewardsMeta[i];
            if (gasHeight_ <= r.blockHeight) {
                if (start_ == 0) {
                    start_ = gasHeight_;
                } else {
                    start_ = rewardsMeta[i - 1].blockHeight;
                }
                end_ = r.blockHeight;
                totalReward_ += (end_ - start_) * r.rewardPerGasHeight;
                console.log(end_, start_,  r.rewardPerGasHeight, (end_ - start_) * r.rewardPerGasHeight);
            }
        }

        return totalReward_;
    }

    function _recentBlockHeight() private view returns (uint256) {
        return rewardsMeta[rewardsMeta.length - 1].blockHeight;
    }

    function nftContract() external view override returns (address) {
        return address(_nftContract);
    }

    function rewards(uint256 tokenId) external view override returns (uint256) {
        return _rewards(tokenId);
    }

    function recentBlockHeight() external view override returns (uint256) {
        return _recentBlockHeight();
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

    function aggregator() external view override returns (address) {
        return _aggregatorProxyAddress;
    }

    function settle() external override {
        require(_recentBlockHeight() + _settleBlockLimit <= block.number, "Settle too early");
        require(_nftContract.totalSupply() * block.number - _nftContract.totalHeight() > 0, "No rewards to settle");

        uint256 totalReward = address(this).balance - settledRewards;
        uint256 daoReward = (totalReward * _comission) / 10000;
        transfer(daoReward, _dao);
        totalReward -= daoReward;
        settledRewards += totalReward;
        
        uint256 rewardPerGasHeight = totalReward / (_nftContract.totalSupply() * block.number - _nftContract.totalHeight() - prevTotalHeight + offset);
        console.log(prevTotalHeight);
        prevTotalHeight = _nftContract.totalSupply() * block.number - _nftContract.totalHeight();
        console.log(prevTotalHeight);

        RewardMetadata memory r = RewardMetadata({
            rewardPerGasHeight: rewardPerGasHeight,
            blockHeight: block.number
        });
        rewardsMeta.push(r);

        emit Settle(block.number, rewardPerGasHeight);
    }

    function claimRewards(uint256 tokenId) external override nonReentrant onlyAggregator {
        address owner = _nftContract.ownerOf(tokenId);
        uint256 nftRewards = _rewards(tokenId);

        if (_recentBlockHeight() > _nftContract.gasHeightOf(tokenId)) {
            offset += _recentBlockHeight() - _nftContract.gasHeightOf(tokenId);
        }
        settledRewards -= nftRewards;
        transfer(nftRewards, owner);

        emit RewardClaimed(owner, nftRewards);
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

    function setAggregator(address aggregatorProxyAddress_) external onlyOwner {
        require(aggregatorProxyAddress_ != address(0), "Aggregator address provided invalid");
        emit AggregatorChanged(_aggregatorProxyAddress, aggregatorProxyAddress_);
        _aggregatorProxyAddress = aggregatorProxyAddress_;
    }

    receive() external payable{}
}