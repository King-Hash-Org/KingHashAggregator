// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

interface IKingHash {
    function handleOracleReport(uint256  _data, bytes32 nodeRankingCommitment) external;

    function getNodeOperatorCount() external returns(uint256);

    function isValidOperator(address operator) external view returns (bool);
}