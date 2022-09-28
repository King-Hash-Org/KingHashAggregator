const { ethers, upgrades, run } = require("hardhat");

export async function deployVault(): Promise<any> {
  const Vault = await ethers.getContractFactory("NodeCapitalVault");
  const vaultProxy = await upgrades.deployProxy(Vault, []);
  await vaultProxy.deployed();

  console.log("Vault deployed: ", vaultProxy.address);

  const implementation = await upgrades.erc1967.getImplementationAddress(vaultProxy.address);
  await run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
}

async function main() {
  await deployVault();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
