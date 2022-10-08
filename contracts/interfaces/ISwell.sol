// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

    /** 
     * @notice The data types for stakes   
     * @param pubKey The public key of the validatator
     * @param signature The signature of the withdrawal
     * @param depositDataRoot The root of the deposit data
     * @param amount The amount of ETH to deposit
     */
      struct Stake {
        bytes pubKey;
        bytes signature;
        bytes32 depositDataRoot;
        uint256 amount;
    }
 
interface ISwell {
    /** 
     * @notice batch stake for multiple validators 
     * @return ids The token IDs that were minted
    */
    function stake (Stake[] calldata stakes, string  calldata referral) external payable returns (uint256[] memory ids);
}
