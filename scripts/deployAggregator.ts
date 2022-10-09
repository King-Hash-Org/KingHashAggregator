const { ethers, upgrades, run } = require("hardhat");

//goerli: 0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b
//ropsten: 0x6f22fFbC56eFF051aECF839396DD1eD9aD6BBA9D

const depositContract = "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b";
const vaultContract = "0x2192e5c6C600F2f0970a246D1Dd465232F23e851";
const nftAddress = "0xf401FFB7C17E307D31A376A04cD69E8e5b68D9Ef"; // nft contract address


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
