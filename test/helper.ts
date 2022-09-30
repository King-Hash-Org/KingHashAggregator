import { ethers } from "hardhat";
import { assert } from "console";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

interface DepositData {
  pubkey: String; // 48 bytes
  withdrawalCredentials: String; // 32 bytes
  signature: String; // 96 bytes
  depositRoot: String; // 32 bytes
}

function remove0xPrefix(s: String): String {
  return s.replace("0x", "");
}

async function prepareTradeV2(
  rawData: String,
  expiredHeight: String,
  length: String,
  buyer: String,
  wallet: SignerWithAddress
) : Promise<String> {
  const padding = "00000000000000000000";
  const strategy = "06";
  const h = ethers.utils.solidityKeccak256(
    ["bytes", "uint256", "address"],
    [rawData, expiredHeight, buyer]
  );

  const sig = await wallet.signMessage(ethers.utils.arrayify(h));
  let sigBreakdown = ethers.utils.splitSignature(sig);

  return (
    "0x" +
    strategy +
    remove0xPrefix(sigBreakdown.v.toString(16)) +
    padding +
    remove0xPrefix(buyer) +
    remove0xPrefix(sigBreakdown.r) +
    remove0xPrefix(sigBreakdown.s) +
    remove0xPrefix(expiredHeight) +
    remove0xPrefix(length) +
    remove0xPrefix(rawData)
  )
}

async function prepareSellData(
  price: String,
  tokenId: String,
  rebate: String,
  expiredHeight: String,
  nonce: String,
  wallet: SignerWithAddress
) : Promise<String> {
  const padding = "000000";
  const h = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "uint256", "uint64"],
    [tokenId, rebate, expiredHeight, nonce]
  );

  const sig = await wallet.signMessage(ethers.utils.arrayify(h));
  let sigBreakdown = ethers.utils.splitSignature(sig);

  return (
    "0x" +
    remove0xPrefix(price) +
    remove0xPrefix(tokenId) +
    remove0xPrefix(rebate) +
    remove0xPrefix(expiredHeight) +
    remove0xPrefix(sigBreakdown.r) +
    remove0xPrefix(sigBreakdown.s) +
    remove0xPrefix(wallet.address) +
    remove0xPrefix(sigBreakdown.v.toString(16)) +
    padding +
    remove0xPrefix(nonce)
  )
}

async function prepareTrade(
  pubkey: String,
  nodePrice: String,
  fee: String,
  blockNumber: String,
  wallet: SignerWithAddress
): Promise<String> {
  assert(pubkey.length == 96 + 2);
  assert(nodePrice.length == 64 + 2);
  assert(fee.length == 64 + 2);
  assert(blockNumber.length == 64 + 2);
  const strategy = "06";
  const padding = "0000000000000000000000000000";

  const h = ethers.utils.solidityKeccak256(
    ["address", "bytes", "uint256", "uint256", "uint256"],
    ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8", pubkey, nodePrice, fee, blockNumber]
  );

  const sig = await wallet.signMessage(ethers.utils.arrayify(h));
  let sigBreakdown = ethers.utils.splitSignature(sig);

  return (
    "0x" +
    strategy +
    remove0xPrefix(sigBreakdown.v.toString(16)) +
    padding +
    remove0xPrefix(pubkey) +
    remove0xPrefix(nodePrice) +
    remove0xPrefix(fee) +
    remove0xPrefix(blockNumber) +
    remove0xPrefix(sigBreakdown.s) +
    remove0xPrefix(sigBreakdown.r)
  );
}

async function prepareEth32(depositData: DepositData, blockTime: String, wallet: SignerWithAddress): Promise<String> {
  assert(depositData.pubkey.length == 96 + 2);
  assert(depositData.withdrawalCredentials.length == 64 + 2);
  assert(depositData.signature.length == 192 + 2);
  assert(depositData.depositRoot.length == 64 + 2);
  assert(blockTime.length == 64 + 2);
  const strategy = "01";
  const padding = "0000000000000000000000000000";

  const h = ethers.utils.solidityKeccak256(
    ["bytes", "bytes", "bytes", "bytes32", "bytes32"],
    [depositData.pubkey, depositData.withdrawalCredentials, depositData.signature, depositData.depositRoot, blockTime]
  );

  const sig = await wallet.signMessage(ethers.utils.arrayify(h));
  let sigBreakdown = ethers.utils.splitSignature(sig);

  return (
    "0x" +
    strategy +
    remove0xPrefix(sigBreakdown.v.toString(16)) +
    padding +
    remove0xPrefix(depositData.pubkey) +
    remove0xPrefix(depositData.withdrawalCredentials) +
    remove0xPrefix(depositData.signature) +
    remove0xPrefix(depositData.depositRoot) +
    remove0xPrefix(blockTime) +
    remove0xPrefix(sigBreakdown.s) +
    remove0xPrefix(sigBreakdown.r)
  );
}

function padding64(s: String): String {
  const xStore = "0000000000000000000000000000000000000000000000000000000000000000";
  assert(s.lastIndexOf("0x") !== 0);
  assert(s.length <= 64);

  const diff = 64 - s.length;
  if (diff > 0) {
    const app = "0x" + xStore.substring(0, diff);
    s = app + s;
  }
  return s;
}

function padding16(s: String): String {
  const xStore = "0000000000000000000000000000000000000000000000000000000000000000";
  assert(s.lastIndexOf("0x") !== 0);
  assert(s.length <= 16);

  const diff = 16 - s.length;
  if (diff > 0) {
    const app = "0x" + xStore.substring(0, diff);
    s = app + s;
  }
  return s;
}

async function eth32RouteData(wallet: SignerWithAddress): Promise<String> {
  const blockTime = padding64((115438892).toString(16)); // Some super large block
  const depositData: DepositData = {
    pubkey: "0xb0917fe7ef834819712d3bc5cbb37fb89b49a6149b573bf07f28059b6560d575ff09a44980bf9b0a37febc0a979b2a01",
    withdrawalCredentials: "0x001c1e94882d5f461636f3ac314986165027497c9a48a0f1bdaa9147fdd09470",
    signature:
      "0xa9e48de9f5bf75fbc9847d2ffa51be36a8377cce0509f83a05bcb7b4507668d665d2e25309ed9880f57ba372b87c3e5817fb8ce289e0a22c655762145c0300d00afe9ebf83ccbd54e8110ad5980f67165fd26d290b9aa50f0f7c49619d587196",
    depositRoot: "0xb84839697afc4e347e943d9472abb000f37c0e61679fb31105d46340d0291aab",
  };

  return await prepareEth32(depositData, blockTime, wallet);
}

async function tradeRouteData(wallet: SignerWithAddress): Promise<String> {
  const pubkey = "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";
  const nodePrice = padding64((32000000000000000000).toString(16)); // 32 eth
  const fee = padding64((100000000000000000).toString(16)); // 0.1 eth
  const blockTime = padding64((259200).toString(16));

  return await prepareTrade(pubkey, nodePrice, fee, blockTime, wallet);
}

function sellRouteData() {
  const pubkey = "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";
  const blockTime = padding64((100000).toString(16));
  const returnValue = padding64((0).toString(16));

  const padding = "000000000000000000000000000000";

  return "0x" + padding + pubkey + blockTime + returnValue;
}

async function tradeRouteDataV2(
  seller: SignerWithAddress,
  buyer: SignerWithAddress,
  authority: SignerWithAddress
): Promise<String> {
  const nodePrice = padding64((32000000000000000000).toString(16)); // 32 eth
  const rebate = padding64((100000000000000000).toString(16)); // 0.1 eth
  const tokenId =  padding64((1).toString(16)); // token 1
  const expiredHeight = padding64((259200).toString(16));
  const nonce = padding16((0).toString(16));

  const rawData = await prepareSellData(nodePrice, tokenId, rebate, expiredHeight, nonce, seller);

  const length =  padding64((1).toString(16)); 
  return prepareTradeV2(rawData, expiredHeight, length, buyer.address, authority);
}

export { DepositData, eth32RouteData, tradeRouteData, sellRouteData, tradeRouteDataV2 };
