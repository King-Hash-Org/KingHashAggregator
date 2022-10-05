// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;

interface RocketStorageInterface {
    // Read Functions
    function getAddress(bytes32 _key) external view returns (address);
}

contract RocketStorage is RocketStorageInterface {
    mapping(bytes32 => address) public addressStorage;

    function setAddressStorage(bytes32 key1, address add1) public {
        addressStorage[key1] = add1;
    }

    /// @param _key The key for the record
    function getAddress(bytes32 _key) external view override returns (address r) {
        return addressStorage[_key];
    }
}
