const { ethers, upgrades, run } = require("hardhat");

// TO DO: Place the address of your proxy here!
const proxyVault = "0xD78736E9EE9895A0a35AB19163Bd1A94E72dea3e";
const proxyAggregator = "0x789983D968074df2395608700C561D4AD959f189";

async function upgrade(contract: String, proxyAddress: String) {
  const Contract = await ethers.getContractFactory(contract);
  await upgrades.upgradeProxy(proxyAddress, Contract);
  const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  await run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
}

async function upgradev2(contract: String, proxyAddress: String) {
  const Contract = await ethers.getContractFactory(contract);
  console.log("Preparing upgrade...");
  const c = await upgrades.prepareUpgrade(proxyAddress, Contract);
  console.log("Upgrade at:", c);

  await proxyAddress.upgradeTo(c);
  await run("verify:verify", {
    address: c,
    constructorArguments: [],
  });
}

async function main() {
  // await upgrade("NodeRewardVault", proxyVault);
  // await upgradev2("NodeRewardVault", proxyVault);
  await upgradev2("Aggregator", proxyAggregator);
  //await upgrade("ValidatorController", proxyValidatorController);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
