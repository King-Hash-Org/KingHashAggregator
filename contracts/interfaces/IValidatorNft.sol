// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import './IERC721AQueryable.sol';

interface IValidatorNft is IERC721AQueryable {
    function totalHeight() external view returns (uint256);

    function validatorExists(bytes calldata pubkey) external view returns (bool);

    function validatorOf(uint256 tokenId) external view returns (bytes memory);

    function gasHeightOf(uint256 tokenId) external view returns (uint256);

    function whiteListMint(bytes calldata data, address _to) external payable;

    function whiteListBurn(uint256 tokenId) external;

    function claimRewards(uint256 tokenId) external;
}
