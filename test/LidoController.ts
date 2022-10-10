import { expect } from "chai";
import { ethers } from "hardhat";


describe("LidoTest", function () {
    async function deployBaseFixture() {

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount, authority, anotherAccount] = await ethers.getSigners();

        const LidoControllerContract = await ethers.getContractFactory("LidoController");
        const lidoController = await LidoControllerContract.deploy();
        await lidoController.initialize();


        return { owner, otherAccount, anotherAccount, authority, lidoController };
    }

    describe("Testing for Lido Controller", function () {

        it("Correct data behaviour for Lido Controller", async function () {
            const { lidoController, owner, otherAccount, anotherAccount } = await deployBaseFixture();
            await lidoController.addAllowList(owner.address);

            //Test Add/Get STETH Balance
            await lidoController.addStEthShares(otherAccount.address, ethers.utils.parseEther("5"))
            const stEthShare1 = await lidoController.getStEthShares(otherAccount.address);
            expect(await ethers.utils.formatUnits(stEthShare1, 18)).to.equal("5.0");

            await lidoController.addStEthShares(anotherAccount.address, ethers.utils.parseEther("33"))
            const stEthShare2 = await lidoController.getStEthShares(anotherAccount.address);
            expect(await ethers.utils.formatUnits(stEthShare2, 18)).to.equal("33.0");
        });

        it("Test Behavior- Not Allowed to add to AllowedList if not Owner ", async function () {
            const { lidoController, otherAccount } = await deployBaseFixture();
            await expect(lidoController.connect(otherAccount).addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Test Behavior- Not Allowed to remove from AllowedList if not Owner ", async function () {
            const { lidoController, otherAccount, anotherAccount } = await deployBaseFixture();
            await lidoController.addAllowList(otherAccount.address) ;
            await expect(lidoController.connect(anotherAccount).removeAllowList(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(lidoController.connect(otherAccount).removeAllowList(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Test Behavior- Not Allowed to add ZeroList to AddList ", async function () {
            const { lidoController, otherAccount } = await deployBaseFixture();
            await expect(lidoController.addAllowList("0x0000000000000000000000000000000000000000")).to.be.revertedWith("User should not be zero address");
        });

        it("Test Behavior- Not Allowed to add SETH Balance Without address approved in allowList ", async function () {
            const { lidoController, owner, anotherAccount } = await deployBaseFixture();
            await expect(lidoController.addStEthShares(owner.address, ethers.utils.parseEther("2"))).to.be.revertedWith("Not allowed to add SETH Shares Balance");
            await expect(lidoController.addStEthShares(anotherAccount.address, ethers.utils.parseEther("3"))).to.be.revertedWith("Not allowed to add SETH Shares Balance");
        });

        it("Test Behavior- Not Allowed to add SETH Balance After Removing Address from allowList", async function () {
            const { lidoController, anotherAccount } = await deployBaseFixture();
            await lidoController.addAllowList(anotherAccount.address);
            await lidoController.connect(anotherAccount).addStEthShares(anotherAccount.address, ethers.utils.parseEther("10"));
            await lidoController.removeAllowList(anotherAccount.address);
            await expect(lidoController.connect(anotherAccount).addStEthShares(anotherAccount.address, ethers.utils.parseEther("10"))).to.be.revertedWith("Not allowed to add SETH Shares Balance");
            await expect(lidoController.connect(anotherAccount).addStEthShares(anotherAccount.address, ethers.utils.parseEther("100"))).to.be.revertedWith("Not allowed to add SETH Shares Balance");
        });

        it("Test Behavior- getAllowList", async function () {
            const { lidoController, owner, otherAccount } = await deployBaseFixture();
            await lidoController.addAllowList(owner.address);
            expect( await lidoController.getAllowList(owner.address)).to.be.eq(true) ; 
            expect( await lidoController.getAllowList(otherAccount.address)).to.be.eq(false) ; 
          });

        it("Referral Behavior", async function () {
            const { lidoController } = await deployBaseFixture();
            expect(await lidoController.getReferral()).to.equal("0x27e2119Bc9Fbca050dF65dDd97cB9Bd14676a08b");;
        });

        it("Zero address behaviour", async function () {
            const { lidoController, otherAccount } = await deployBaseFixture();
            await lidoController.addAllowList(otherAccount.address);
            await expect(lidoController.connect(otherAccount).addStEthShares("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("33"))).to.be.revertedWith("User should not be zero address");
            await expect(lidoController.connect(otherAccount).addStEthShares("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("3"))).to.be.revertedWith('User should not be zero address');
        });

        it.skip("UUPSUpgradeable Behavior", async function () {
            const { otherAccount, lidoController } = await deployBaseFixture();
            await expect(lidoController.upgradeTo(otherAccount.address)).to.emit(lidoController, "Upgraded").withArgs(otherAccount.address);
        });

        it("OwnableUpgradeable Behavior", async function () {
            const { owner, otherAccount, lidoController } = await deployBaseFixture();
            await expect(lidoController.transferOwnership(otherAccount.address)).to.emit(lidoController, "OwnershipTransferred").withArgs(owner.address, otherAccount.address);
            expect(await lidoController.owner()).to.equal(otherAccount.address);
        });

        it.skip("ReentrancyGuardUpgradeable Behavior", async function () {
            const { owner, otherAccount, lidoController } = await deployBaseFixture();

        });

    });

});
