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
    address private _aggregatorProxyAddress;

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
        _tax = 100;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _rewards(uint256 tokenId) private view returns (uint256) {
        uint256 total = _nftContract.totalSupply() * block.number - _nftContract.totalHeight();
        require(total > 0, "No rewards to claim");

        uint256 totalReward = address(this).balance;

        return totalReward * (block.number - _nftContract.gasHeightOf(tokenId)) / total;
    }

    function nftContract() external view override returns (address) {
        return address(_nftContract);
    }

    function blockRewards() external view override returns (uint256) {
        uint256 total = _nftContract.totalSupply() * block.number - _nftContract.totalHeight();
        require(total > 0, "No rewards to claim");

        uint256 totalReward = address(this).balance;

        return totalReward / total;
    }

    function rewards(uint256 tokenId) external view override returns (uint256) {
        return _rewards(tokenId);
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

    function transfer(uint256 amount, address to) external override nonReentrant onlyAggregator {
        require(to != address(0), "Recipient address provided invalid");
        payable(to).transfer(amount);
    }

    function setComission(uint256 comission_) external onlyOwner {
        require(comission_ < 10000, "Comission cannot be 100%");
        _comission = comission_;
    }

    function setDao(address dao_) external onlyOwner {
        require(dao_ != address(0), "DAO address provided invalid");
        _dao = dao_;
    }

    function setAuthority(address authority_) external onlyOwner {
        require(authority_ != address(0), "Authority address provided invalid");
        _authority = authority_;
    }

    function setAggregator(address aggregatorProxyAddress_) external onlyOwner {
        require(aggregatorProxyAddress_ != address(0), "Aggregator address provided invalid");
        _aggregatorProxyAddress = aggregatorProxyAddress_;
    }

    receive() external payable{}
}