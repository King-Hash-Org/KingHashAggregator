// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface IController {
    function getAuthority() external view returns (address);

    function setAuthority(address _authority) external;
}