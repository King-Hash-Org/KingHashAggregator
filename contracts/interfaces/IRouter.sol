// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

abstract contract IRouter {
    function initialize(bool mainnet, address[] calldata contracts_) internal virtual;

    function _route(bytes calldata data) internal virtual returns (bool);
}