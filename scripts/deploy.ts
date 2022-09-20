import { AddressZero } from "@ethersproject/constants";

const { ethers, upgrades } = require("hardhat");

async function main() {
  const ValidatorController = await ethers.getContractFactory("ValidatorController");
  const validatorControllerProxy = await upgrades.deployProxy(ValidatorController, [])

  const Aggregator = await ethers.getContractFactory("Aggregator");
  const aggregatorProxy = await upgrades.deployProxy(Aggregator, 
    [
      false, 
      AddressZero, 
      validatorControllerProxy.address,
    ]);
  await aggregatorProxy.deployed();

  console.log(validatorControllerProxy.address);
  console.log(aggregatorProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export{}