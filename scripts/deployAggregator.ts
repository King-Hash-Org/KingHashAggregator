const { ethers, upgrades, run } = require("hardhat");
const depositContract = "0x6f22fFbC56eFF051aECF839396DD1eD9aD6BBA9D";
const vaultContract = "0x488AdC84Bfb7eC2158e799fA8fE1e74460A7C73C";
const nftAddress = "0x9fBd485E1B18Ca5829dA4576c42a34CBf82554eD"; // nft contract address

export async function deployAggregator(
  depositContract: String,
  vaultContract: String,
  nftAddress: String
): Promise<any> {
  const Aggregator = await ethers.getContractFactory("Aggregator");
  const aggregatorProxy = await upgrades.deployProxy(Aggregator, [depositContract, vaultContract, nftAddress]);
  await aggregatorProxy.deployed();

  console.log("Aggregator deployed: ", aggregatorProxy.address);

  const implementation = await upgrades.erc1967.getImplementationAddress(aggregatorProxy.address);
  await run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });

  return await aggregatorProxy;
}

async function main() {
  await deployAggregator(depositContract, vaultContract, nftAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
