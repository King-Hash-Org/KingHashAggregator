const { ethers, upgrades, run } = require("hardhat");
const nftAddress = "0x7d6E43B3e191b976c5CD15038747E9361806a3A9"; // nft contract address

export async function deployVault(nftAddress: String): Promise<any> {
  const Vault = await ethers.getContractFactory("NodeRewardVault");
  const vaultProxy = await upgrades.deployProxy(Vault, [nftAddress]);
  await vaultProxy.deployed();

  console.log("Vault deployed: ", vaultProxy.address);

  const implementation = await upgrades.erc1967.getImplementationAddress(vaultProxy.address);
  await run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
}

async function main() {
  await deployVault(nftAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
