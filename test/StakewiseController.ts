import { expect } from "chai";
import { ethers } from "hardhat";


describe("Stakewise Test", function () {
    async function deployBaseFixture() {
      // Contracts are deployed using the first signer/account by default
      const [owner, otherAccount, authority, anotherAccount] = await ethers.getSigners();
  
      const RocketDepositPoolContract = await ethers.getContractFactory("RocketDepositPool");
      const rocketDepositPoolContract = await RocketDepositPoolContract.deploy();
  
      const stakedEthTokenContract = await ethers.getContractFactory("RocketTokenRETH");
      const stakedEthToken = await stakedEthTokenContract.deploy();
  
  
    //   await rocketDepositPoolContract.setRocketAddress(rocketTokenRETH.address);
      const StakewiseControllerContract = await ethers.getContractFactory("StakewiseController");
      const stakewiseController = await StakewiseControllerContract.deploy();
      await stakewiseController.initialize();
  
      return { owner, otherAccount, anotherAccount, authority, stakewiseController };
    }
  
    describe("Testing for Stakewise Controller", function () {
  
      it("Correct data behaviour for Stakewise Controller", async function () {
        const { stakewiseController, owner, otherAccount, anotherAccount } = await deployBaseFixture();
        await stakewiseController.addAllowList(owner.address);
  
        //Test Add/Get RETH Balance
        await stakewiseController.addREthBalance(otherAccount.address, ethers.utils.parseEther("5"))
        const sETH2Balance = await stakewiseController.getSETH2Balance(otherAccount.address);
        expect(await ethers.utils.formatUnits(sETH2Balance, 18)).to.equal("5.0");
      });
  
      it("Test Behavior- Not Allowed to add to AllowedList if not Owner ", async function () {
        const { stakewiseController, otherAccount } = await deployBaseFixture();
        await expect(stakewiseController.connect(otherAccount).addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("Ownable: caller is not the owner");
      });
  
      it("Test Behavior- Not Allowed to remove from AllowedList if not Owner ", async function () {
        const { stakewiseController, otherAccount, anotherAccount } = await deployBaseFixture();
        await stakewiseController.addAllowList(otherAccount.address);
        await expect(stakewiseController.connect(anotherAccount).removeAllowList(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(stakewiseController.connect(otherAccount).removeAllowList(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
      });
  
      it("Test Behavior- Not Allowed to add ZeroList to AddList ", async function () {
        const { stakewiseController, otherAccount } = await deployBaseFixture();
        await expect(stakewiseController.addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("User should not be zero address");
        await expect(stakewiseController.connect(otherAccount).addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("Ownable: caller is not the owner");
  
      });
  
  
      it("Test Behavior- Not Allowed to add SETH2 Balance Without address approved in allowList ", async function () {
        const { stakewiseController, owner } = await deployBaseFixture();
        await expect(stakewiseController.addSETH2Balance(owner.address, ethers.utils.parseEther("2"))).to.be.revertedWith("Not allowed to add RETH Balance");
        await expect(stakewiseController.addSETH2Balance(owner.address, ethers.utils.parseEther("100"))).to.be.revertedWith("Not allowed to add RETH Balance");
      });
  
      it("Test Behavior- Not Allowed to add SETH2 Balance After Removing Address from allowList", async function () {
        const { stakewiseController, owner, otherAccount } = await deployBaseFixture();
        await stakewiseController.addAllowList(otherAccount.address);
        await stakewiseController.connect(otherAccount).addREthBalance(otherAccount.address, ethers.utils.parseEther("10"));
        await stakewiseController.removeAllowList(otherAccount.address);
        await expect(stakewiseController.connect(otherAccount).addREthBalance(otherAccount.address, ethers.utils.parseEther("10"))).to.be.revertedWith("Not allowed to add RETH Balance");
        await expect(stakewiseController.connect(otherAccount).addREthBalance(otherAccount.address, ethers.utils.parseEther("100"))).to.be.revertedWith("Not allowed to add RETH Balance");
      });
  
      it("Test Behavior- getAllowList", async function () {
        const { stakewiseController, owner, otherAccount } = await deployBaseFixture();
        await stakewiseController.addAllowList(owner.address);
        expect(await stakewiseController.getAllowList(owner.address)).to.eq(true);
        expect(await stakewiseController.getAllowList(otherAccount.address)).to.eq(false);
      });
  
      it("Zero address behaviour", async function () {
        const { stakewiseController, owner } = await deployBaseFixture();
        await stakewiseController.addAllowList(owner.address);
        await expect(stakewiseController.addREthBalance("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("3"))).to.be.revertedWith("User should not be zero address");
      });
  
      it.skip("UUPSUpgradeable Behavior", async function () {
        const { otherAccount, stakewiseController } = await deployBaseFixture();
        await expect(stakewiseController.upgradeTo(otherAccount.address)).to.emit(stakewiseController, "Upgraded").withArgs(otherAccount.address);
      });
  
      it("OwnableUpgradeable Behavior", async function () {
        const { owner, otherAccount, rocketController, anotherAccount } = await deployBaseFixture();
        await expect(rocketController.transferOwnership(otherAccount.address)).to.emit(rocketController, "OwnershipTransferred").withArgs(owner.address, otherAccount.address);
        expect(await rocketController.owner()).to.equal(otherAccount.address);
      });
  
      it.skip("ReentrancyGuardUpgradeable Behavior", async function () {
        const { owner, otherAccount, stakewiseController } = await deployBaseFixture();
  
      });
  
    });
  
  });
  
