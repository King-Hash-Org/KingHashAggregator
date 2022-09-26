// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IDepositContract.sol";
import "../interfaces/IValidatorNft.sol";
import "../interfaces/INodeRewardVault.sol";

contract ValidatorNftRouter is Initializable {
    struct Signature {
        address signer;
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    struct UserListing {
        uint256 tokenId; 
        uint256 rebate;
        uint256 expiredHeight; // listing expiry block height
        Signature signature;
        uint64 nonce;
    }

    struct Trade {
        uint256[] prices;
        uint256 expiredHeight; // trade expiry block height
        address receiver;
        UserListing[] userListings;
        Signature signature;
    }

    event Eth32Deposit(bytes _pubkey, bytes _withdrawal, address _owner);
    event RewardClaimed(address _owner, uint256 _amount, uint256 _total);

    IValidatorNft public nftContract;
    INodeRewardVault public vault;
    IDepositContract public depositContract;

    address public nftAddress;
    mapping(address => uint64) public nonces;

    function __ValidatorNftRouter__init(address depositContract_, address vault_, address nftContract_) internal onlyInitializing {
        depositContract = IDepositContract(depositContract_);
        vault = INodeRewardVault(vault_);
        nftContract = IValidatorNft(nftContract_);
        nftAddress = nftContract_;
    }

    //slither-disable-next-line calls-loop
    function precheck(bytes calldata data) private view returns (bytes32) {
        bytes calldata pubkey = data[16:64];
        bytes calldata withdrawalCredentials = data[64:96];
        bytes calldata signature = data[96:192];
        bytes32 depositDataRoot = bytes32(data[192:224]);
        uint256 blockNumber = uint256(bytes32(data[224:256]));

        require(!nftContract.validatorExists(pubkey), "Pub key already in used");
        uint256 currentBlock = block.number ;
        require(blockNumber > currentBlock , "Block height too old, please generate a new transaction");

        return keccak256(abi.encodePacked(pubkey, withdrawalCredentials, signature, depositDataRoot, bytes32(blockNumber)));
    }

    function signercheck(bytes32 s, bytes32 r, uint8 v, bytes32 hash_, address signer_) private pure {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, hash_));
        address signer = ecrecover(prefixedHash, v, r, s);

        require(signer == signer_, "Not authorized");
        require(signer != address(0), "ECDSA: invalid signature");
    }

    //slither-disable-next-line calls-loop
    function _tradeRoute(Trade memory trade, bytes calldata data) private returns (uint256) {
        require(trade.expiredHeight > block.number, "Trade has expired");

        // change this in the future
        uint256 sum = 0;
        uint256 i = 0;

        for (i = 0; i < trade.userListings.length; i++) {
            UserListing memory userListing = trade.userListings[i];
            uint256 price = trade.prices[i];
            sum += price;
                        
            require(price > 31 ether, "Node too cheap");
            require(userListing.expiredHeight > block.number, "Listing has expired");
            require(nftContract.ownerOf(userListing.tokenId) == userListing.signature.signer, "Not owner");
            require(userListing.nonce == nonces[userListing.signature.signer], "Incorrect nonce");
            nonces[userListing.signature.signer]++;

            bytes32 hash = keccak256(abi.encodePacked(userListing.tokenId, userListing.rebate, userListing.expiredHeight, userListing.nonce));
            signercheck(userListing.signature.s, userListing.signature.r, userListing.signature.v, hash, userListing.signature.signer);
            
            nftContract.safeTransferFrom(userListing.signature.signer, trade.receiver, userListing.tokenId);
            uint256 userPrice = price * (10000 - vault.tax()) / 10000;
            payable(userListing.signature.signer).transfer(userPrice);
            payable(vault.dao()).transfer(price - userPrice);
        }

        bytes32 authHash = keccak256(data[160:]);
        signercheck(trade.signature.s, trade.signature.r, trade.signature.v, authHash, vault.authority());

        return sum;
    }

    //slither-disable-next-line reentrancy-events
    function deposit(bytes calldata data) private {
        bytes calldata pubkey = data[16:64];
        bytes calldata withdrawalCredentials = data[64:96];
        bytes calldata signature = data[96:192];
        bytes32 depositDataRoot = bytes32(data[192:224]);

        depositContract.deposit{value: 32 ether}(pubkey, withdrawalCredentials, signature, depositDataRoot);
        
        emit Eth32Deposit(pubkey, withdrawalCredentials, msg.sender);
    }

    //slither-disable-next-line calls-loop
    function eth32Route(bytes calldata data) internal returns (bool) {
        bytes32 hash = precheck(data);
        signercheck(bytes32(data[256:288]), bytes32(data[288:320]), uint8(bytes1(data[1])), hash, vault.authority());
        deposit(data);

        nftContract.whiteListMint(data[16:64], msg.sender);
        return true;
    }

    function tradeRoute(bytes calldata data) internal returns (uint256) {
        //slither-disable-next-line uninitialized-local
        Trade memory trade;

        uint256 i = 0;
        trade.signature.signer = address(0);
        trade.signature.v = uint8(bytes1(data[1]));
        trade.receiver = address(bytes20(data[12:32]));
        trade.signature.r = bytes32(data[32:64]);
        trade.signature.s = bytes32(data[64:96]);
        trade.expiredHeight = uint256(bytes32(data[96:128]));

        uint256 len = uint256(bytes32(data[128:160]));
        uint256[] memory prices = new uint256[](len);
        UserListing[] memory userListings = new UserListing[](len);
        for (i = 0; i < len; i++) {
            prices[i] = uint256(bytes32(data[160 + i * 224:192 + i * 224]));
            userListings[i].tokenId = uint256(bytes32(data[192 + i * 224:224 + i * 224]));
            userListings[i].rebate = uint256(bytes32(data[224 + i * 224:256 + i * 224]));
            userListings[i].expiredHeight = uint256(bytes32(data[256 + i * 224:288 + i * 224]));
            userListings[i].signature.r = bytes32(data[288 + i * 224:320 + i * 224]);
            userListings[i].signature.s = bytes32(data[320 + i * 224:352 + i * 224]);
            userListings[i].signature.signer = address(bytes20(data[352 + i * 224:372 + i * 224]));
            userListings[i].signature.v = uint8(bytes1(data[372 + i * 224]));
            userListings[i].nonce = uint64(bytes8(data[376 + i * 224:384 + i * 224]));
        }
        trade.prices = prices;
        trade.userListings = userListings;

        return _tradeRoute(trade, data);
    }

    //slither-disable-next-line reentrancy-events
    function rewardRoute(uint256 tokenId) internal {
        address owner = nftContract.ownerOf(tokenId);
        require(msg.sender == nftAddress, "Message sender is not the Nft contract");

        uint256 rewards = vault.rewards(tokenId);
        uint256 userReward = (10000 - vault.comission()) * rewards / 10000;

        vault.transfer(userReward, owner);
        vault.transfer(rewards - userReward, vault.dao());
        emit RewardClaimed(owner, userReward, rewards);
    }
}