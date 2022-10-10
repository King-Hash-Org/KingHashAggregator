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

    uint256[] private _nftRewards;
    uint256 private _totalSettleRewards = 0;
    uint256[] private _blockRewards;

    bool private _isSettleStart = false;
    uint256 private _settleRewards = 0;
    uint256 private _settleBlockNumber = 0;
    uint256 private _settleIndex = 0;

    event ComissionChanged(uint256 _before, uint256 _after);
    event TaxChanged(uint256 _before, uint256 _after);
    event DaoChanged(address _before, address _after);
    event AuthorityChanged(address _before, address _after);
    event AggregatorChanged(address _before, address _after);
    event RewardClaimed(address _owner, uint256 _amount, uint256 _total);
    event Transferred(address _to, uint256 _amount);

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

    function settle(uint256 quantity) external {
        uint256 start = _settleIndex;
        uint256 end = start + quantity;
        if (_isSettleStart) {
            if (end >= _nftRewards.length) {
                _isSettleStart = false;
                 _settle(start, _nftRewards.length);
            } else {
                _settle(start, end);
            }
            return;
        }

        if (quantity == 0) {
            _settle(0, _nftRewards.length);
            return;
        }

        if (quantity > _nftRewards.length) {
            _settle(0, _nftRewards.length);
            return;
        }

        if (!_isSettleStart) {
            _isSettleStart = true;
            _settleRewards = address(this).balance - _totalSettleRewards;
            _settleBlockNumber = block.number;
            uint256 total = _nftContract.totalSupply() * _settleBlockNumber - _nftContract.totalHeight();
            _blockRewards.push(_settleRewards/total);
        }
       
         _settle(start, end);

        return ;
    }

    function _settle(uint256 start, uint256 end) private {
        uint256 totalRewards = address(this).balance - _totalSettleRewards;
        uint256 blockNumber = block.number;
        if (_isSettleStart) {
            totalRewards = _settleRewards;
            blockNumber = _settleBlockNumber;
        }

        uint256 total = _nftContract.totalSupply() * blockNumber - _nftContract.totalHeight();
        require(total > 0, "No rewards to claim");

        for (uint256 i= start; i < end; i++) {
            uint256 nftReward = (totalRewards * (blockNumber - _nftContract.gasHeightOf(i))) / total;
            _nftRewards[i] = _nftRewards[i] + (nftReward);
            _nftContract.updateHeight(i, blockNumber);
        }
    }

    function withdrawReward(uint256 tokenId) external override {
        address owner = _nftContract.ownerOf(tokenId);
        uint256 nftRewards = _rewards(tokenId);
        if (nftRewards == 0) {
            return;
        }

        _nftRewards[tokenId] = 0;
        _totalSettleRewards = _totalSettleRewards - nftRewards;

        uint256 userReward = ((10000 - _comission) * nftRewards) / 10000;
        transfer(userReward, owner);
        if (nftRewards > userReward) {
            transfer(nftRewards - userReward, _dao);
        }

        emit RewardClaimed(owner, userReward, nftRewards);
    }

    function initNftReward(uint256 quantity)external override onlyNftContract {
        for (uint256 i = 0; i < quantity; i++) {
            _nftRewards.push(0);
        }   
    }

    function rewards(uint256 tokenId) external view override returns (uint256) {
        return _rewards(tokenId);
    }

    function _rewards(uint256 tokenId) private view returns (uint256) {
        return _nftRewards[tokenId];
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