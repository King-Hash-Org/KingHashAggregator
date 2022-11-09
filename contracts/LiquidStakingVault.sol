// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./KEth.sol";

contract LiquidStakingVault is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, KEth {
// contract LiquidStakingVault is KEth {

    // uint256 private constant MINIMUM = 100_000_000_000;
    // address private _aggregatorProxyAddress;
    // uint256 public underlyingEth;

    event DepositReceived(address indexed from, uint256 amount, uint256 time);

    // event AggregatorChanged(address _from, address _to);

    // modifier onlyAggregator() {
    //     require(_aggregatorProxyAddress == msg.sender, "Not allowed to touch funds");
    //     _;
    // }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initalize() external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        // _aggregatorProxyAddress = address(0x1);
        _mint(_msgSender(), 10000000000000000000000);
    }


    function _authorizeUpgrade(address) internal override onlyOwner {}



     function deposit() external payable  {
        // Check deposit settings
        require(msg.value >= 0.00000000001 ether, "The deposited amount is less than the minimum deposit size");

        //  Calculate deposit fee
        uint256 depositFee = msg.value * 0.00001 ether / 1 ether ;
        uint256 depositNet = msg.value - depositFee ;

        //  Mint rETH to user account
        _mintKETH(msg.sender, depositNet);
        // rocketTokenRETH.mint(depositNet, msg.sender);

        // Process deposit
        //  Emit deposit received event
        emit DepositReceived(msg.sender, msg.value, block.timestamp);
    }


    // function _shareAmount(uint256 amount) private view returns (uint256) {
    //     return (totalSupply() * amount) / underlyingEth;
    // }

    // function _etherAmount(uint256 amount) private view returns (uint256) {
    //     return (underlyingEth * amount) / totalSupply();
    // }

    // function mint(address account, uint256 amount) external payable onlyAggregator nonReentrant {
    //     require(msg.value == amount, "Ether amount provided is not sufficient");
    //     require(msg.value > MINIMUM, "Ether provided is less than minimum amount");
    //     uint256 shares = _shareAmount(amount);
    //     _mint(account, shares);

    //     underlyingEth += amount;
    // }

    // function redeem(address account, uint256 amount) external onlyAggregator nonReentrant {
    //     uint256 ethers = _etherAmount(amount);
        
    //     payable(account).transfer(ethers);
    //     _burn(account, amount);

    //     underlyingEth -= ethers;
    // }
    // function setAggregator(address aggregatorProxyAddress_) external onlyOwner {
    //     require(aggregatorProxyAddress_ != address(0), "Aggregator address provided invalid");
    //     emit AggregatorChanged(_aggregatorProxyAddress, aggregatorProxyAddress_);
    //     _aggregatorProxyAddress = aggregatorProxyAddress_;
    // }

}