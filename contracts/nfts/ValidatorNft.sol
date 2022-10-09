// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ERC721AQueryable.sol";
import "../interfaces/INodeRewardVault.sol";

contract ValidatorNft is Ownable, ERC721AQueryable, ReentrancyGuard {
  address constant public OPENSEA_PROXY_ADDRESS = 0x1E0049783F008A0085193E00003D00cd54003c71;
  uint256 constant public MAX_SUPPLY = 6942069420;

  INodeRewardVault private nodeRewardVault;
  
  mapping(bytes => bool) private validatorRecords;
  bytes[] public _validators;
  uint256[] public _gasHeights;
  uint256[] public _nodeCapital;

  bool private _isOpenSeaProxyActive = false;
  uint256 private _totalHeight = 0;
  address private _aggregatorProxyAddress;
  address private _nodeRewardVaultProxyAddress;

  event BaseURIChanged(string _before, string _after);
  event Transferred(address _to, uint256 _amount);
  event AggregatorChanged(address _before, address _after);
  event NodeRewardVaultChanged(address _before, address _after);
  event OpenSeaState(bool _isActive);

  modifier onlyAggregator() {
    require(_aggregatorProxyAddress == msg.sender, "Not allowed to mint/burn nft");
    _;
  }

  modifier onlyNodeRewardVault() {
    require(_nodeRewardVaultProxyAddress == msg.sender, "Not allowed to update rewards data");
    _;
  }

  constructor() ERC721A("Validator NFT", "vNFT") {}

  function aggregatorProxyAddress() external view returns (address) {
    return _aggregatorProxyAddress;
  }

  function nodeRewardVaultProxyAddress() external view returns (address) {
    return _nodeRewardVaultProxyAddress;
  }

  function totalHeight() external view returns (uint256) {
    return _totalHeight;
  }

  function activeValidators() external view returns (bytes[] memory) {
    uint256 total = _nextTokenId();
    uint256 tokenIdsIdx;
    bytes[] memory validators = new bytes[](total);
    TokenOwnership memory ownership;

    for (uint256 i = _startTokenId(); i < total; ++i) {
        ownership = _ownershipAt(i);
        if (ownership.burned) { 
          continue;
        }

        validators[tokenIdsIdx++] = _validators[i];
    }

    return validators;
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
    _nodeCapital.push(32 ether);
    _safeMint(_to, 1);
    nodeRewardVault.initNftReward(1);
  }

  function whiteListBurn(uint256 tokenId) external onlyAggregator {
    _nodeCapital[tokenId] = 0;
    _burn(tokenId);
  }

  function updateNodeCapital(uint256 tokenId, uint256 value) external onlyAggregator {
    if (value > _nodeCapital[tokenId]) {
        _nodeCapital[tokenId] = value;
    }
  }

  function nodeCapitalOf(uint256 tokenId)  external view returns (uint256) {
    require(_exists(tokenId), "Token does not exist");
     return _nodeCapital[tokenId];
  }

  // // metadata URI
  string private _baseTokenURI;

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function setBaseURI(string calldata baseURI) external onlyOwner {
    emit BaseURIChanged(_baseTokenURI, baseURI);
    _baseTokenURI = baseURI;
  }

  function withdrawMoney(address to) external nonReentrant onlyOwner {
    emit Transferred(to, address(this).balance);
    payable(to).transfer(address(this).balance);
  }

  function setAggregator(address aggregatorProxyAddress_) external onlyOwner {
    require(aggregatorProxyAddress_ != address(0), "Aggregator address provided invalid");
    emit AggregatorChanged(_aggregatorProxyAddress, aggregatorProxyAddress_);
    _aggregatorProxyAddress = aggregatorProxyAddress_;
  }

  function setNodeRewardVault(address nodeRewardVaultProxyAddress_) external onlyOwner {
    require(nodeRewardVaultProxyAddress_ != address(0), "NodeRewardVault address provided invalid");
    emit NodeRewardVaultChanged(_nodeRewardVaultProxyAddress, nodeRewardVaultProxyAddress_);
    _nodeRewardVaultProxyAddress = nodeRewardVaultProxyAddress_;
    nodeRewardVault = INodeRewardVault(nodeRewardVaultProxyAddress_);
  }

  function numberMinted(address owner) external view returns (uint256) {
    return _numberMinted(owner);
  }

  function _updateHeight(uint256 tokenId, uint256 blockNumber) private {
    require(_exists(tokenId), "Token does not exist");
    _totalHeight = _totalHeight - _gasHeights[tokenId] + blockNumber;
    _gasHeights[tokenId] = blockNumber;
  }

  function updateHeight(uint256 tokenId, uint256 blockNumber) external onlyNodeRewardVault  {
    _updateHeight(tokenId, blockNumber);
  }

  function batchUpdateRewards(uint256[] calldata tokenIds, uint256 blockNumber) external onlyNodeRewardVault {
    for (uint256 i = 0; i < tokenIds.length; i++) {
      _updateHeight(tokenIds[i], blockNumber);
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
    if (from == address(0) || from == to) {
      return;
    }

    for (uint256 i = 0; i < quantity; i++) {
      nodeRewardVault.withdrawReward(startTokenId + i);
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
    emit OpenSeaState(isOpenSeaProxyActive_);
    _isOpenSeaProxyActive = isOpenSeaProxyActive_;
  }
}