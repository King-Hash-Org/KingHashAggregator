import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Address, zeroAddress } from "ethereumjs-util";
import { AddressZero } from "@ethersproject/constants";

describe("NodeCapitalVault", function () {
  async function deployBaseFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const NodeCapitalVault = await ethers.getContractFactory("NodeCapitalVault");
    const nodeCapitalVault = await NodeCapitalVault.deploy();
    await nodeCapitalVault.initialize();

    return { nodeCapitalVault, owner, otherAccount };
  }

  // fixture with rewards inside the vault
  async function deployRewardFixture() {
    const { nodeCapitalVault, owner, otherAccount } = await deployBaseFixture();

    await owner.sendTransaction({
      to: nodeCapitalVault.address,
      value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
    });

    return { nodeCapitalVault, owner, otherAccount };
  }

  describe("Aggregator settings", function () {
    it("Should set the right aggregator", async function () {
      const { nodeCapitalVault, otherAccount } = await loadFixture(deployBaseFixture);
      await expect(nodeCapitalVault.setAggregator(otherAccount.address)).to.emit(nodeCapitalVault, "AggregatorChanged").withArgs("0x0000000000000000000000000000000000000001", otherAccount.address);

      expect(await nodeCapitalVault.aggregator()).to.equal(otherAccount.address);
    });

    it("Should revert & not set the aggregator", async function () {
      const { nodeCapitalVault, otherAccount } = await loadFixture(deployBaseFixture);

      await expect(nodeCapitalVault.connect(otherAccount).setAggregator(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(nodeCapitalVault.setAggregator(AddressZero)).to.be.revertedWith("Aggregator address provided invalid");
    });
  });

  describe("Transfer and rewards", function () {
    it("Should have the right balance", async function () {
      const { nodeCapitalVault } = await loadFixture(deployRewardFixture);

      expect(await ethers.provider.getBalance(nodeCapitalVault.address)).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should not be able to transfer", async function () {
      const { nodeCapitalVault, owner } = await loadFixture(deployRewardFixture);

      await expect(nodeCapitalVault.transfer(ethers.utils.parseEther("100"), owner.address)).to.be.revertedWith(
        "Not allowed to touch funds"
      );

      await nodeCapitalVault.setAggregator(owner.address);
      await expect(nodeCapitalVault.transfer(ethers.utils.parseEther("100"), AddressZero)).to.be.revertedWith(
        "Recipient address provided invalid"
      );
    });

    it("Should be able to transfer", async function () {
      const { nodeCapitalVault, owner } = await loadFixture(deployRewardFixture);
      await nodeCapitalVault.setAggregator(owner.address);
  
      await expect(nodeCapitalVault.transfer(ethers.utils.parseEther("100"), owner.address)).to.emit(nodeCapitalVault, "Transferred").withArgs(owner.address, ethers.utils.parseEther("100"));
    });
  });
});
