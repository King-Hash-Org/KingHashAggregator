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

    RewardMetadata[] public cumArr;
    uint256 public unclaimedRewards;
    uint256 public daoRewards;
    uint256 public lastPublicSettle;
    uint256 public publicSettleLimit;

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
    event PublicSettleLimitChanged(uint256 _before, uint256 _after);
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
            value: 0,
            height: 0
        });

        cumArr.push(r);
        unclaimedRewards = 0;
        lastPublicSettle = 0;
        publicSettleLimit = 216000;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _rewards(uint256 tokenId) private view returns (uint256) {
        uint256 gasHeight = _nftContract.gasHeightOf(tokenId);
        uint256 low = 0;
        uint256 high = cumArr.length;

        while (low < high) {
            uint256 mid = (low + high) >> 1;

            if (cumArr[mid].height > gasHeight) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        // At this point `low` is the exclusive upper bound. We will use it.
        return cumArr[cumArr.length - 1].value - cumArr[low - 1].value;
    }

    function _settle() private {
        uint256 outstandingRewards = address(this).balance - unclaimedRewards - daoRewards;
        if (outstandingRewards == 0 || cumArr[cumArr.length - 1].height == block.number) {
            return;
        }

        uint256 daoReward = (outstandingRewards * _comission) / 10000;
        daoRewards += daoReward;
        outstandingRewards -= daoReward;
        unclaimedRewards += outstandingRewards;

        uint256 averageRewards = outstandingRewards / _nftContract.totalSupply();
        uint256 currentValue = cumArr[cumArr.length - 1].value + averageRewards;
        RewardMetadata memory r = RewardMetadata({
            value: currentValue,
            height: block.number
        });
        cumArr.push(r);

        emit Settle(block.number, averageRewards);
    }

    function nftContract() external view override returns (address) {
        return address(_nftContract);
    }

    function rewards(uint256 tokenId) external view override returns (uint256) {
        return _rewards(tokenId);
    }

    function rewardsHeight() external view override returns (uint256) {
        return cumArr[cumArr.length - 1].height + 1;
    }

    function rewardsAndHeights(uint256 amt) external view override returns (RewardMetadata[] memory) {
        if (amt >= cumArr.length) {
            return cumArr;
        }

        RewardMetadata[] memory r = new RewardMetadata[](amt);

        for (uint256 i = 0; i < amt; i++) {
            r[i] = cumArr[cumArr.length - 1 - i];
        }

        return r;
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

    function settle() external override onlyAggregator {
        _settle();
    }

    function publicSettle() external override {
        if (lastPublicSettle + publicSettleLimit > block.number) {
            return;
        }

        _settle();
        lastPublicSettle = block.number;
    }

    function claimRewards(uint256 tokenId) external override nonReentrant onlyAggregator {
        address owner = _nftContract.ownerOf(tokenId);
        uint256 nftRewards = _rewards(tokenId);

        unclaimedRewards -= nftRewards;
        transfer(nftRewards, owner);

        emit RewardClaimed(owner, nftRewards);
    }

    function transfer(uint256 amount, address to) private {
        require(to != address(0), "Recipient address provided invalid");
        payable(to).transfer(amount);
        emit Transferred(to, amount);
    }

    function claimDao() external nonReentrant {
        transfer(daoRewards, _dao);
        daoRewards = 0;
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

    function setPublicSettleLimit(uint256 publicSettleLimit_) external onlyOwner {
        emit PublicSettleLimitChanged(publicSettleLimit, publicSettleLimit_);
        publicSettleLimit = publicSettleLimit_;
    }

    receive() external payable{}
}