// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract KingHashOperators is Initializable  {
    mapping(address => bool) public kingHashOperators;
    mapping(bytes32 => address) public nameToAddress;
    mapping(address => uint256) public operatorsPool;
    address chainUpAddress = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2; //ChainUp // for adding to tests later.
    uint256 public totalOperatorCount  ;

    function getChainUp() public view returns (address) {
        return  chainUpAddress;
    }

    function _isKingHashDAO(address operator) internal view returns (bool) {
        return kingHashOperators[operator];
    }

    function addToOperatorPool(address operator, uint256 amount) internal {
        require(kingHashOperators[operator], "Not part of operatorsPool");
        operatorsPool[operator] += amount;
    }

    function subtractFromOperatorPool(address operator) internal {
        require(kingHashOperators[operator], "Not part of operatorsPool");
        require(operatorsPool[operator] >= 32 ether , "This operator has less than 32 ETH in the Pool");

        operatorsPool[operator] -= 32 ether;
    }

    function checkif32ETH(address operator) internal view returns (bool) {
        return operatorsPool[operator] >= 32 ether;
    }

    function operatorEthBalance(address operator) public view returns (uint256) {
        return operatorsPool[operator];
    }

    function addressOf(string memory name) external view returns (address) {
        return nameToAddress[keccak256(abi.encodePacked(name))];
    }
}