// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../libraries/UnstructuredStorage.sol" ;

contract KEth is ERC20Upgradeable {

    // Events
    event EtherDeposited(address indexed from, uint256 amount, uint256 time);

    using UnstructuredStorage for bytes32;
    bytes32 internal constant TOTAL_KETH_SUPPLY = keccak256("Kinghash.KEth.totalSupply");
    bytes32 internal constant TOTAL_ETH_BALANCE = keccak256("Kinghash.totalEthBalance");


    // Receive an ETH deposit from a minipool or generous individual
    receive() external payable {
        // Emit ether deposited event
        emit EtherDeposited(msg.sender, msg.value, block.timestamp);
    }

 
    function getName() public view returns (string memory) {
        return name();
    }

    // Calculate the amount of ETH backing an amount of kETH
    function getEthValue(uint256 _kethAmount) public view returns (uint256) {
        uint256 totalEthBalance = getTotalETHBalance();
        uint256 kEthSupply = getTotalKETHSupply();
        // Use 1:1 ratio if no kETH is minted
        if (kEthSupply == 0) { return _kethAmount; }
        // Calculate and return
        return _kethAmount *  totalEthBalance / (kEthSupply);
    }

        function getKethValue(uint256 _ethAmount) public view returns (uint256) {
        uint256 totalEthBalance = getTotalETHBalance();
        uint256 kEthSupply = getTotalKETHSupply();
        // Use 1:1 ratio if no kETH is minted
        if (kEthSupply == 0) { return _ethAmount; }
        require(totalEthBalance > 0, "Cannot calculate kETH token amount while total network balance is zero");
        // Calculate and return
        return _ethAmount* kEthSupply/ totalEthBalance;
    }

    function getTotalKETHSupply() internal view returns (uint256){
        return TOTAL_KETH_SUPPLY.getStorageUint256();
    }

    function addTotalKETHSupply(uint256 _kethAmount) internal  {
        uint256 newKEthSupply = TOTAL_KETH_SUPPLY.getStorageUint256()+ _kethAmount ; 
        TOTAL_KETH_SUPPLY.setStorageUint256(newKEthSupply);
    }

    function getTotalETHBalance() internal view returns (uint256){
        return TOTAL_ETH_BALANCE.getStorageUint256();
    }

    function addTotalETHBalance(uint256 _ethAmount) internal  {
        uint256 newETHTotalBalance = TOTAL_ETH_BALANCE.getStorageUint256() + _ethAmount ; 
        TOTAL_ETH_BALANCE.setStorageUint256(newETHTotalBalance );
    }
    
    function mintKETH(address _address, uint256 _depositNet ) internal returns (uint256) {
        uint256 _kethToMint = getKethValue(_depositNet); 
        _mint(_address, _kethToMint); 
        return _kethToMint ;
    }
}
