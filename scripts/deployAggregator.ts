const { ethers, upgrades, run } = require("hardhat");
const depositContract = "0x6f22fFbC56eFF051aECF839396DD1eD9aD6BBA9D";
const vaultContract = "0x5d67622DcFaf996a92E71732ca8e5f19d260f24a";
const nftAddress = "0x4e4Bf734F17e03196864CA6656911F69f46A90E0"; // nft contract address

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
