// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract KingHashOperators is Initializable, OwnableUpgradeable {
    mapping(bytes32 => address) public nameToAddress;
    mapping(address => bool) public operators;
    mapping(address => uint256) public operatorPoolBalances;
    address public chainUpAddress = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2; //ChainUp // for adding to tests later.
    uint256 public totalOperatorCount;

    function __Operators__init() internal onlyInitializing {
        __Ownable_init();
    }

    function getChainUp() public view returns (address) {
        return chainUpAddress;
    }

    function _isValidOperator(address operator) internal view returns (bool) {
        return operators[operator];
    }

    function isValidOperator(address operator) external view returns (bool) {
        return _isValidOperator(operator);
    }

    function addToOperatorBalance(address operator, uint256 amount) internal {
        require(operators[operator], "Not part of operatorsPool");
        operatorPoolBalances[operator] += amount;
    }

    function subtractFromOperatorBalance(address operator, uint256 amount) internal {
        require(operators[operator], "Not part of operatorsPool");
        require(operatorPoolBalances[operator] >= amount, "This operator has insufficient amount");

        operatorPoolBalances[operator] -= amount;
    }

    function operatorBalance(address operator) public view returns (uint256) {
        return operatorPoolBalances[operator];
    }

    function addressOf(string memory name) external view returns (address) {
        return nameToAddress[keccak256(abi.encodePacked(name))];
    }

    function addOperator(address operator, string memory name) external onlyOwner {
        require(operator != address(0), "DAO should not be zero address");
        operators[operator] = true;
        nameToAddress[keccak256(abi.encodePacked(name))] = operator;
        totalOperatorCount++;
    }

    function removeOperator(address operator, string memory name) external onlyOwner {
        require(operators[operator] == true || nameToAddress[keccak256(abi.encodePacked(name))] == operator, "DAO name does not match address");
        operators[operator] = false;
        nameToAddress[keccak256(abi.encodePacked(name))] = address(0);
        totalOperatorCount--;
    }
}