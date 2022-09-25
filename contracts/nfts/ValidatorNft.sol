// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ERC721AQueryable.sol";
import "../interfaces/IAggregator.sol";

contract ValidatorNft is Ownable, ERC721AQueryable, ReentrancyGuard {
  address constant public OPENSEA_PROXY_ADDRESS = 0x1E0049783F008A0085193E00003D00cd54003c71;
  uint256 constant public MAX_SUPPLY = 6942069420;

  IAggregator private aggregator;
  
  mapping(bytes => bool) private validatorRecords;
  bytes[] public _validators;
  uint256[] public _gasHeights;

  bool private _isOpenSeaProxyActive = false;
  uint256 private _totalHeight = 0;
  address private _aggregatorProxyAddress;

  modifier onlyAggregator() {
    require(_aggregatorProxyAddress == msg.sender, "Not allowed to mint/burn nft");
    _;
  }

  constructor() ERC721A("Validator Nft", "vNFT") {}

  function aggregatorProxyAddress() external view returns (address) {
    return _aggregatorProxyAddress;
  }

  function totalHeight() external view returns (uint256) {
    return _totalHeight;
  }

  function validatorExists(bytes calldata pubkey) external view returns (bool) {
    return validatorRecords[pubkey];
  }

  function validatorOf(uint256 tokenId) external view returns (bytes memory) {
    return _validators[tokenId];
  }

  function validatorsOfOwner(address owner) external view returns (bytes[] memory) {
    unchecked {
      //slither-disable-next-line uninitialized-local
      uint256 tokenIdsIdx;
      //slither-disable-next-line uninitialized-local
      address currOwnershipAddr;
      uint256 tokenIdsLength = balanceOf(owner);
      bytes[] memory tokenIds = new bytes[](tokenIdsLength);
      TokenOwnership memory ownership;
      for (uint256 i = _startTokenId(); tokenIdsIdx != tokenIdsLength; ++i) {
          ownership = _ownershipAt(i);
          if (ownership.burned) {
              continue;
          }
          if (ownership.addr != address(0)) {
              currOwnershipAddr = ownership.addr;
          }
          if (currOwnershipAddr == owner) {
              tokenIds[tokenIdsIdx++] = _validators[i];
          }
      }
      return tokenIds;
    }
  }

  function tokenOfValidator(bytes calldata pubkey) external view returns (uint256) {
    for (uint256 i = 0; i < _validators.length; i++) {
      if (keccak256(_validators[i]) == keccak256(pubkey) && _exists(i)) {
        return i;
      }
    }
    return MAX_SUPPLY;
  }

  function gasHeightOf(uint256 tokenId) external view returns (uint256) {
    require(_exists(tokenId), "Token does not exist");

    return _gasHeights[tokenId];
  }

  function whiteListMint(bytes calldata pubkey, address _to) external onlyAggregator {
    require(
      totalSupply() + 1 <= MAX_SUPPLY,
      "not enough remaining reserved for auction to support desired mint amount"
    );
    require(!validatorRecords[pubkey], "Pub key already in used");

    validatorRecords[pubkey] = true;
    _validators.push(pubkey);
    _gasHeights.push(block.number);
    _totalHeight += block.number;

    _safeMint(_to, 1);
  }

  function whiteListBurn(uint256 tokenId) external onlyAggregator {
    _burn(tokenId);
  }

  // // metadata URI
  string private _baseTokenURI;

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function setBaseURI(string calldata baseURI) external onlyOwner {
    _baseTokenURI = baseURI;
  }

  function withdrawMoney() external nonReentrant onlyOwner {
    payable(owner()).transfer(address(this).balance);
  }

  function setAggregator(address aggregatorProxyAddress_) external onlyOwner {
    _aggregatorProxyAddress = aggregatorProxyAddress_;
    aggregator = IAggregator(_aggregatorProxyAddress);
  }

  function numberMinted(address owner) external view returns (uint256) {
    return _numberMinted(owner);
  }

  //slither-disable-next-line reentrancy-benign
  function _claimRewards(uint256 tokenId) private {
    require(_exists(tokenId), "Token does not exist");

    aggregator.disperseRewards(tokenId);

    _totalHeight = _totalHeight - _gasHeights[tokenId] + block.number;
    _gasHeights[tokenId] = block.number;
  }

  function claimRewards(uint256 tokenId) external nonReentrant {
    _claimRewards(tokenId);
  }

  function claimRewardsOf(address from_) external nonReentrant {
    unchecked {
      uint256 tokenIdsIdx;
      address currOwnershipAddr;
      uint256 tokenIdsLength = balanceOf(from_);
      TokenOwnership memory ownership;
      for (uint256 i = _startTokenId(); tokenIdsIdx != tokenIdsLength; ++i) {
          ownership = _ownershipAt(i);
          if (ownership.burned) {
              continue;
          }
          if (ownership.addr != address(0)) {
              currOwnershipAddr = ownership.addr;
          }
          if (currOwnershipAddr == from_) {
              _claimRewards(i);
          }
      }
    }
  }

  function batchClaimRewards(uint256[] calldata tokenId) external nonReentrant {
    for (uint256 i = 0; i < tokenId.length; i++) {
      _claimRewards(tokenId[i]);
    }
  }

  function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override 
  {
    // no need to claim reward if user is minting nft
    if (from == address(0)) {
      return;
    }

    for (uint256 i = 0; i < quantity; i++) {
      _claimRewards(startTokenId + i);
    }
  }

  ////////below is the new code//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function isApprovedForAll(address owner, address operator)
      public
      view
      override
      returns (bool)
  {
      // Get a reference to OpenSea's proxy registry contract by instantiating
      // the contract using the already existing address.

      if (
          _isOpenSeaProxyActive &&
          OPENSEA_PROXY_ADDRESS == operator
      ) {
          return true;
      }
      if (operator == _aggregatorProxyAddress) {
          return true;
      }

      return super.isApprovedForAll(owner, operator);
  }

  // function to disable gasless listings for security in case
  // opensea ever shuts down or is compromised
  function setIsOpenSeaProxyActive(bool isOpenSeaProxyActive_)
      external
      onlyOwner
  {
      _isOpenSeaProxyActive = isOpenSeaProxyActive_;
  }
}