const { ethers, upgrades, run } = require("hardhat");
const { AddressZero } =  require("@ethersproject/constants");

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deployLidoController(): Promise<any> {
    const LidoController = await ethers.getContractFactory("LidoController");
    const lidoControllerProxy = await upgrades.deployProxy(LidoController, []);
    await lidoControllerProxy.deployed();

    console.log("LidoController Proxy deployed: ", lidoControllerProxy.address);
    await delay(10000);

    const implementation = await upgrades.erc1967.getImplementationAddress(lidoControllerProxy.address);
    await run("verify:verify", {
        address: implementation,
        constructorArguments: [],
    });

    return lidoControllerProxy.address;
}

export async function deployRocketController(): Promise<any> {
    const RocketController = await ethers.getContractFactory("RocketController");
    const rocketControllerProxy = await upgrades.deployProxy(RocketController, []);
    await rocketControllerProxy.deployed();
  
    console.log("RocketController Proxy deployed: ", rocketControllerProxy.address);
    await delay(10000);
  
    const implementation = await upgrades.erc1967.getImplementationAddress(rocketControllerProxy.address);
    await run("verify:verify", {
      address: implementation,
      constructorArguments: [],
    });

    return rocketControllerProxy.address;
}

export async function deployNft(): Promise<any> {
    const ValidatorNft = await ethers.getContractFactory("ValidatorNft");
    const validatorNft = await ValidatorNft.deploy();
  
    await validatorNft.deployed();
  
    console.log("Nft deployed: ", validatorNft.address);
    await delay(10000);
  
    await run("verify:verify", {
      address: validatorNft.address,
      constructorArguments: [],
    });

    return validatorNft.address;
}

export async function deployNodeCapitalVault(): Promise<any> {
    const Vault = await ethers.getContractFactory("NodeCapitalVault");
    const vaultProxy = await upgrades.deployProxy(Vault, []);
    await vaultProxy.deployed();
  
    console.log("NodeCapitalVault Proxy deployed: ", vaultProxy.address);
    await delay(10000);
  
    const implementation = await upgrades.erc1967.getImplementationAddress(vaultProxy.address);
    await run("verify:verify", {
      address: implementation,
      constructorArguments: [],
    });
}

export async function deployNodeRewardVault(nftAddress: String): Promise<any> {
    const Vault = await ethers.getContractFactory("NodeRewardVault");
    const vaultProxy = await upgrades.deployProxy(Vault, [nftAddress]);
    await vaultProxy.deployed();
  
    console.log("NodeRewardVault Proxy deployed: ", vaultProxy.address);
    await delay(10000);
  
    const implementation = await upgrades.erc1967.getImplementationAddress(vaultProxy.address);
    await run("verify:verify", {
      address: implementation,
      constructorArguments: [],
    });
}

export async function deployTimelock(delayTime: Number, proposersArray: String[], executorsArray: String[]): Promise<any> {
    const Timelock = await ethers.getContractFactory("TimelockController");
    const timelock = await Timelock.deploy(delayTime, proposersArray, executorsArray, AddressZero);
    await timelock.deployed();

    console.log("Timelock deployed: ", timelock.address);
    await delay(10000);
  
    await run("verify:verify", {
      address: timelock.address,
      constructorArguments: [
        delayTime,
        proposersArray,
        executorsArray,
        AddressZero
      ],
    });
  
    return timelock.address;
}

export async function deployAggregator(
    depositContract: String,
    vaultContract: String,
    nftAddress: String
  ): Promise<any> {
    const Aggregator = await ethers.getContractFactory("Aggregator");
    const aggregatorProxy = await upgrades.deployProxy(Aggregator, [
      depositContract, 
      vaultContract, 
      nftAddress
    ]);
    await aggregatorProxy.deployed();
  
    console.log("Aggregator Proxy deployed: ", aggregatorProxy.address);
  
    const implementation = await upgrades.erc1967.getImplementationAddress(aggregatorProxy.address);
    await run("verify:verify", {
      address: implementation,
      constructorArguments: [],
    });
  
    return await aggregatorProxy;
}

export async function deployAll(
        depositContract: String,
        delayTime: Number, 
        proposersArray: String[], 
        executorsArray: String[]
    ) {
    const Timelock = await ethers.getContractFactory("TimelockController");
    const timelock = await Timelock.deploy(delayTime, proposersArray, executorsArray, AddressZero);
    await timelock.deployed();
    console.log("Timelock deployed: ", timelock.address);

    const ValidatorNft = await ethers.getContractFactory("ValidatorNft");
    const validatorNft = await ValidatorNft.deploy();
    await validatorNft.deployed();
    console.log("Nft deployed: ", validatorNft.address);

    const NodeRewardVault = await ethers.getContractFactory("NodeRewardVault");
    const nodeRewardVaultProxy = await upgrades.deployProxy(NodeRewardVault, [validatorNft.address]);
    await nodeRewardVaultProxy.deployed();
    console.log("NodeRewardVault Proxy deployed: ", nodeRewardVaultProxy.address);

    const Vault = await ethers.getContractFactory("NodeCapitalVault");
    const vaultProxy = await upgrades.deployProxy(Vault, []);
    await vaultProxy.deployed();
    console.log("NodeCapitalVault Proxy deployed: ", vaultProxy.address);

    const Aggregator = await ethers.getContractFactory("Aggregator");
    const aggregatorProxy = await upgrades.deployProxy(Aggregator, [
      depositContract, 
      nodeRewardVaultProxy.address, 
      validatorNft.address,
    ]);
    await aggregatorProxy.deployed();
    console.log("Aggregator Proxy deployed: ", aggregatorProxy.address);

    await validatorNft.setAggregator(aggregatorProxy.address);
    await nodeRewardVaultProxy.setAggregator(aggregatorProxy.address);
    await vaultProxy.setAggregator(aggregatorProxy.address);

    await aggregatorProxy.transferOwnership(timelock.address);
    await validatorNft.transferOwnership(executorsArray[0]);
    await nodeRewardVaultProxy.transferOwnership(timelock.address);
    await vaultProxy.transferOwnership(timelock.address);
    console.log("Transferred ownership of Aggregator Proxy to Timelock Contract:", timelock.address);
}

export {};