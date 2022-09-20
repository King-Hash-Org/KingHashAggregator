// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "../interfaces/ISSVInterface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SSVRouter is Initializable {
    ISSVNetwork public ssvContract;
    uint32[] private operators;
    bytes[] private pubkeyshares; // 48 bytes
    bytes[] private encryptedshares; // 416 bytes, need double check the breakdown

    function __SSVRouter__init(bool mainnet, address[] memory contracts) internal onlyInitializing {
        address ssvContract_ = contracts[0];
        if (mainnet) {
            // updates this
            ssvContract = ISSVNetwork(0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04);
        } else {
            if (ssvContract_ == address(0)) {
                ssvContract = ISSVNetwork(0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04);
            } else {
                ssvContract = ISSVNetwork(ssvContract_);
            }
        }
    }

    function __SSVRouter__route(bytes calldata data) internal returns (bool) {
        // swap eth to ssv or deduct ssv
        // swap()??

        bytes memory pubkey = data[16:64];
        pubkeyshares = [
            data[64:112],
            data[112:160],
            data[160:208],
            data[208:256]
        ];
        encryptedshares = [
            data[256:672],
            data[672:1088],
            data[1088:1504],
            data[1504:1920]
        ];

        uint256 amount = uint256(bytes32(data[1920:1952]));

        operators = [
            uint32(bytes4(data[1984:1988])), 
            uint32(bytes4(data[1988:1992])), 
            uint32(bytes4(data[1992:1996])), 
            uint32(bytes4(data[1996:2000]))
        ];
        
        ssvContract.registerValidator(
            pubkey,
            operators,
            pubkeyshares,
            encryptedshares,
            amount
        );
        
        return true;
    }

    function ssvRoute(bytes calldata data) internal returns (bool) {
        return __SSVRouter__route(data);
    }
}