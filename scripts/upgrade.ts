const { ethers, upgrades, run } = require("hardhat");

// TO DO: Place the address of your proxy here!
const proxyValidatorController = "0x7Cbc3e3F12Aae70175479721c8E2a226d16D0De7";
const proxyAggregator = "0xA3e456d4dAA808adF2a4CB7b5c755bF64058a03f";

async function upgrade(contract: String, proxyAddress: String) {
  const Contract = await ethers.getContractFactory(contract);
  await upgrades.upgradeProxy(proxyAddress, Contract);
  const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  await run("verify:verify", {
    address: implementation,
    constructorArguments: [],
  });
}

async function main() {
  await upgrade("Aggregator", proxyAggregator);
  //await upgrade("ValidatorController", proxyValidatorController);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
