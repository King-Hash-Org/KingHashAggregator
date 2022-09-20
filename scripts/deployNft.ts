const { ethers, run } = require("hardhat");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deployNft(): Promise<any> {
  const ValidatorNft = await ethers.getContractFactory("ValidatorNft");
  const validatorNft = await ValidatorNft.deploy();

  await validatorNft.deployed();

  await delay(20000);

  console.log("Nft deployed: ", validatorNft.address);
  await run("verify:verify", {
    address: validatorNft.address,
    constructorArguments: [],
  });
}

async function main() {
  await deployNft();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
