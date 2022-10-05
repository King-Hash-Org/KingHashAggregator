import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Address, zeroAddress } from "ethereumjs-util";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("LidoTest", function () {
  async function deployBaseFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, authority, anotherAccount] = await ethers.getSigners();

    const NftContract = await ethers.getContractFactory("ValidatorNft");
    const nftContract = await NftContract.deploy();

    const NodeRewardVault = await ethers.getContractFactory("NodeRewardVault");
    const nodeRewardVault = await NodeRewardVault.deploy();
    await nodeRewardVault.initialize(nftContract.address);

    const DepositContract = await ethers.getContractFactory("DepositContract");
    const depositContract = await DepositContract.deploy();

    const LidoContract = await ethers.getContractFactory("Lido");
    const lidoContract = await LidoContract.deploy();

    const LidoControllerContract = await ethers.getContractFactory("LidoController");
    const lidoController = await LidoControllerContract.deploy();
    await lidoController.initialize();

    const RocketDepositPoolContract = await ethers.getContractFactory("RocketDepositPool");
    const rocketDepositPoolContract = await RocketDepositPoolContract.deploy();

    const RocketTokenRETHContract = await ethers.getContractFactory("RocketTokenRETH");
    const rocketTokenRETH = await RocketTokenRETHContract.deploy();

    const RocketStorageContract = await ethers.getContractFactory("RocketStorage");
    const rocketStorage = await RocketStorageContract.deploy();
    rocketStorage.setAddressStorage("0x65DD923DDFC8D8AE6088F80077201D2403CBD565F0BA25E09841E2799EC90BB2", rocketDepositPoolContract.address);
    rocketStorage.setAddressStorage("0xE3744443225BFF7CC22028BE036B80DE58057D65A3FDCA0A3DF329F525E31CCC", rocketTokenRETH.address);

    await rocketDepositPoolContract.setRocketAddress(rocketTokenRETH.address);

    const RocketControllerContract = await ethers.getContractFactory("RocketController");
    const rocketController = await RocketControllerContract.deploy();
    await rocketController.initialize();

    const Aggregator = await ethers.getContractFactory("Aggregator");
    const aggregator = await Aggregator.deploy();
    await aggregator.initialize(depositContract.address, nodeRewardVault.address, nftContract.address, lidoContract.address, lidoController.address, rocketStorage.address, rocketController.address);
    await nftContract.setAggregator(aggregator.address);

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount, anotherAccount, authority, lidoController, rocketController };
  }

  describe("Testing for Lido Controller", function () {

    it("Correct data behaviour for Lido Controller", async function () {
      const { lidoController, owner, otherAccount, anotherAccount } = await deployBaseFixture();
      await lidoController.addAllowList(owner.address);

      //Test Add/Get STETH Balance
      await lidoController.addStEthShares(otherAccount.address, ethers.utils.parseEther("5"))
      const stEthShare1 = await lidoController.getStEthShares(otherAccount.address);
      await expect(ethers.utils.formatUnits(stEthShare1, 18)).to.equal("5.0");

      await lidoController.addStEthShares(anotherAccount.address, ethers.utils.parseEther("33"))
      const stEthShare2 = await lidoController.getStEthShares(anotherAccount.address);
      await expect(ethers.utils.formatUnits(stEthShare2, 18)).to.equal("33.0");
    });

    it("Allowlist Behavior 1", async function () {
      const { lidoController, owner, anotherAccount } = await deployBaseFixture();
      await expect(lidoController.addStEthShares(owner.address, ethers.utils.parseEther("2"))).to.be.rejectedWith("Not allowed to add SETH Shares Balance");
      expect(lidoController.addStEthShares(anotherAccount.address, ethers.utils.parseEther("3"))).to.be.revertedWith("Not allowed to add SETH Shares Balance");
    });

    it("Allowlist Behavior 2", async function () {
      const { lidoController, owner, anotherAccount } = await deployBaseFixture();
      await lidoController.addAllowList(anotherAccount.address);
      expect(lidoController.connect(anotherAccount).addStEthShares(anotherAccount.address, ethers.utils.parseEther("10")));
      await lidoController.removeAllowList(anotherAccount.address);
      await expect(lidoController.connect(anotherAccount).addStEthShares(anotherAccount.address,
        ethers.utils.parseEther("10"))).to.be.revertedWith("Not allowed to add SETH Shares Balance");
    });

    it("Allowlist Behavior 3", async function () {
      const { lidoController, owner, otherAccount } = await deployBaseFixture();
      await lidoController.addAllowList(otherAccount.address);
      await expect(await lidoController.getAllowList(otherAccount.address)).to.equal(true);
    });

    it("Referral Behavior", async function () {
      const { lidoController, owner } = await deployBaseFixture();
      expect(await lidoController.getReferral()).to.equal("0x27e2119Bc9Fbca050dF65dDd97cB9Bd14676a08b");;
    });

    it("Zero address behaviour", async function () {
      const { lidoController, owner, otherAccount, anotherAccount } = await deployBaseFixture();
      //Zero address behaviour
      await lidoController.addAllowList(otherAccount.address);
      await expect(lidoController.connect(otherAccount).addStEthShares("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("33"))).to.be.revertedWith("User should not be zero address");
      await expect(lidoController.connect(otherAccount).addStEthShares("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("3"))).to.be.revertedWith('User should not be zero address');
      // expect(await lidoController.connect(anotherAccount).addStEthShares(anotherAccount.address, ethers.utils.parseEther("3"))).to.be.revertedWith("Not allowed to add SETH Shares Balance"); 
    });

    it("UUPSUpgradeable Behavior", async function () {
      const { otherAccount, rocketController } = await deployBaseFixture();
      // await expect(lidoController.upgradeTo(otherAccount.address)).to.emit(rocketController, "Upgraded").withArgs( otherAccount.address) ;
    });

    it("OwnableUpgradeable Behavior 1", async function () {
      const { owner, otherAccount, lidoController, anotherAccount } = await deployBaseFixture();
      await expect(lidoController.transferOwnership(otherAccount.address)).to.emit(lidoController, "OwnershipTransferred").withArgs(owner.address, otherAccount.address);
      expect(await lidoController.owner()).to.be.equal(otherAccount.address);
      // await expect(lidoController.transferOwnership(anotherAccount.address)).to.emit(lidoController, "OwnershipTransferred").withArgs(otherAccount.address, anotherAccount.address);
      // expect(await lidoController.owner()).to.be.equal(anotherAccount.address);
    });

    it("OwnableUpgradeable Behavior 2", async function () {
      const { owner, otherAccount, lidoController, anotherAccount } = await deployBaseFixture();
      // await expect(lidoController.transferOwnership(anotherAccount.address)).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(lidoController.transferOwnership(anotherAccount.address)).to.emit(lidoController, "OwnershipTransferred").withArgs(owner.address, anotherAccount.address);
      expect(await lidoController.owner()).to.be.equal(anotherAccount.address);
    });

    it("ReentrancyGuardUpgradeable Behavior", async function () {
      const { owner, otherAccount, aggregator, lidoController, anotherAccount } = await deployBaseFixture();
      await expect(lidoController.transferOwnership(otherAccount.address)).to.emit(lidoController, "OwnershipTransferred").withArgs(owner.address, otherAccount.address);
      expect(await lidoController.owner()).to.be.equal(otherAccount.address);
    });

  });

});
