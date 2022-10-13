// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

/**
 * @title Interface for Controller
 * @notice Further protect contracts from unauthorized usage. 
 */
interface IController {
    /**
     * @notice getter method for authority
     * @return address _authority
     */
    function getAuthority() external view returns (address);

    /**
     * @notice setter method for authority
     * @dev onlyOwner - modifier which will only allow use of function to the owner.
     */
    function setAuthority(address _authority) external;
}