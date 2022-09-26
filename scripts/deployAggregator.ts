const { ethers, upgrades, run } = require("hardhat");
const depositContract = "0x6f22fFbC56eFF051aECF839396DD1eD9aD6BBA9D";
const vaultContract = "0x0F5790C5736271889E37FE28Ec9388B4205e7AF9";
const nftAddress = "0x7d6E43B3e191b976c5CD15038747E9361806a3A9"; // nft contract address

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
