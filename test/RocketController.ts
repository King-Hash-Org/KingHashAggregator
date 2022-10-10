import { expect } from "chai";
import { ethers } from "hardhat";

describe("RocketTest", function () {
  async function deployBaseFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, authority, anotherAccount] = await ethers.getSigners();

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

    return { owner, otherAccount, anotherAccount, authority, rocketController };
  }

  describe("Testing for Rocket Controller", function () {

    it("Correct data behaviour for RocketPool Controller", async function () {
      const { rocketController, owner, otherAccount, anotherAccount } = await deployBaseFixture();
      await rocketController.addAllowList(owner.address);

      //Test Add/Get RETH Balance
      await rocketController.addREthBalance(otherAccount.address, ethers.utils.parseEther("5"))
      const rEthBalance = await rocketController.getREthBalance(otherAccount.address);
      expect(await ethers.utils.formatUnits(rEthBalance, 18)).to.equal("5.0");
    });

    it("Test Behavior- Not Allowed to add to AllowedList if not Owner ", async function () {
      const { rocketController, otherAccount } = await deployBaseFixture();
      await expect(rocketController.connect(otherAccount).addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Test Behavior- Not Allowed to remove from AllowedList if not Owner ", async function () {
      const { rocketController, otherAccount, anotherAccount } = await deployBaseFixture();
      await rocketController.addAllowList(otherAccount.address);
      await expect(rocketController.connect(anotherAccount).removeAllowList(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(rocketController.connect(otherAccount).removeAllowList(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Test Behavior- Not Allowed to add ZeroList to AddList ", async function () {
      const { rocketController, otherAccount } = await deployBaseFixture();
      await expect(rocketController.addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("User should not be zero address");
      await expect(rocketController.connect(otherAccount).addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("Ownable: caller is not the owner");

    });


    it("Test Behavior- Not Allowed to add RETH Balance Without address approved in allowList ", async function () {
      const { rocketController, owner } = await deployBaseFixture();
      await expect(rocketController.addREthBalance(owner.address, ethers.utils.parseEther("2"))).to.be.revertedWith("Not allowed to add RETH Balance");
      await expect(rocketController.addREthBalance(owner.address, ethers.utils.parseEther("100"))).to.be.revertedWith("Not allowed to add RETH Balance");
    });

    it("Test Behavior- Not Allowed to add RETH Balance After Removing Address from allowList", async function () {
      const { rocketController, owner, otherAccount } = await deployBaseFixture();
      await rocketController.addAllowList(otherAccount.address);
      await rocketController.connect(otherAccount).addREthBalance(otherAccount.address, ethers.utils.parseEther("10"));
      await rocketController.removeAllowList(otherAccount.address);
      await expect(rocketController.connect(otherAccount).addREthBalance(otherAccount.address, ethers.utils.parseEther("10"))).to.be.revertedWith("Not allowed to add RETH Balance");
      await expect(rocketController.connect(otherAccount).addREthBalance(otherAccount.address, ethers.utils.parseEther("100"))).to.be.revertedWith("Not allowed to add RETH Balance");
    });

    it("Test Behavior- getAllowList", async function () {
      const { rocketController, owner, otherAccount } = await deployBaseFixture();
      await rocketController.addAllowList(owner.address);
      expect(await rocketController.getAllowList(owner.address)).to.eq(true);
      expect(await rocketController.getAllowList(otherAccount.address)).to.eq(false);
    });

    it("Zero address behaviour", async function () {
      const { rocketController, owner } = await deployBaseFixture();
      await rocketController.addAllowList(owner.address);
      await expect(rocketController.addREthBalance("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("3"))).to.be.revertedWith("User should not be zero address");
    });

    it.skip("UUPSUpgradeable Behavior", async function () {
      const { otherAccount, rocketController } = await deployBaseFixture();
      await expect(rocketController.upgradeTo(otherAccount.address)).to.emit(rocketController, "Upgraded").withArgs(otherAccount.address);
    });

    it("OwnableUpgradeable Behavior", async function () {
      const { owner, otherAccount, rocketController, anotherAccount } = await deployBaseFixture();
      await expect(rocketController.transferOwnership(otherAccount.address)).to.emit(rocketController, "OwnershipTransferred").withArgs(owner.address, otherAccount.address);
      expect(await rocketController.owner()).to.equal(otherAccount.address);
    });

    it.skip("ReentrancyGuardUpgradeable Behavior", async function () {
      const { owner, otherAccount, rocketController } = await deployBaseFixture();

    });

  });

});
