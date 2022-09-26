const { ethers, upgrades, run } = require("hardhat");
const nftAddress = "0x60b741e2F3A343B281d6bce50d5F2bA4fADc04bC"; // nft contract address

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
