import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Address, zeroAddress } from "ethereumjs-util";
import { AddressZero } from "@ethersproject/constants";

describe("NodeRewardVault", function () {
  async function deployBaseFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const NftContract = await ethers.getContractFactory("ValidatorNft");
    const nftContract = await NftContract.deploy();

    const NodeRewardVault = await ethers.getContractFactory("NodeRewardVault");
    const nodeRewardVault = await NodeRewardVault.deploy();
    await nodeRewardVault.initialize(nftContract.address);

    const DepositContract = await ethers.getContractFactory("DepositContract");
    const depositContract = await DepositContract.deploy();

    const Aggregator = await ethers.getContractFactory("Aggregator");
    const aggregator = await Aggregator.deploy();
    await aggregator.initialize(depositContract.address, nodeRewardVault.address, nftContract.address);

    await nodeRewardVault.setAggregator(aggregator.address);
    await nftContract.setAggregator(aggregator.address);

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  // fixture with rewards inside the vault
  async function deployRewardFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployBaseFixture();

    const data =
      "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
    await aggregator.stake([data], { value: ethers.utils.parseEther("32") });

    await owner.sendTransaction({
      to: nodeRewardVault.address,
      value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
    });

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  describe("Nft setting", function () {
    it("Should have the right nft address", async function () {
      const { nodeRewardVault, nftContract } = await loadFixture(deployBaseFixture);

      expect(await nodeRewardVault.nftContract()).to.equal(nftContract.address);
    });

  });

  describe("Authority setting", function () {
    it("Should have the right default authority", async function () {
      const { nodeRewardVault } = await loadFixture(deployBaseFixture);

      expect(await nodeRewardVault.authority()).to.equal("0xF5ade6B61BA60B8B82566Af0dfca982169a470Dc");
    });

    it("Should set the right authority", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);
      await nodeRewardVault.setAuthority(otherAccount.address);

      expect(await nodeRewardVault.authority()).to.equal(otherAccount.address);
    });

    it("Should revert & not set the authority", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);

      await expect(nodeRewardVault.connect(otherAccount).setAuthority(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(nodeRewardVault.setAuthority(AddressZero)).to.be.revertedWith(
        "Authority address provided invalid"
      );
    });
  });

  describe("Aggregator settings", function () {
    it("Should have the right aggregator", async function () {
      const { nodeRewardVault, aggregator } = await loadFixture(deployBaseFixture);

      expect(await nodeRewardVault.aggregator()).to.equal(aggregator.address);
    });

    it("Should set the right aggregator", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);
      await nodeRewardVault.setAggregator(otherAccount.address);

      expect(await nodeRewardVault.aggregator()).to.equal(otherAccount.address);
    });

    it("Should revert & not set the aggregator", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);

      await expect(nodeRewardVault.connect(otherAccount).setAggregator(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(nodeRewardVault.setAggregator(AddressZero)).to.be.revertedWith(
        "Aggregator address provided invalid"
      );
    });
  });

  describe("DAO settings", function () {
    it("Should have the right DAO address", async function () {
      const { nodeRewardVault } = await loadFixture(deployBaseFixture);

      expect(await nodeRewardVault.dao()).to.equal("0xd17a3B462170c53592a165Dfd007c7ED2b84F956");
    });

    it("Should set the right DAO address", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);
      await nodeRewardVault.setDao(otherAccount.address);

      expect(await nodeRewardVault.dao()).to.equal(otherAccount.address);
    });

    it("Should revert & not set the DAO address", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);

      await expect(nodeRewardVault.connect(otherAccount).setDao(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(nodeRewardVault.setDao(AddressZero)).to.be.revertedWith(
        "DAO address provided invalid"
      );
    });
  });

  describe("Comission settings", function () {
    it("Should have the right comission", async function () {
      const { nodeRewardVault } = await loadFixture(deployBaseFixture);

      expect(await nodeRewardVault.comission()).to.equal(1000);
    });

    it("Should set the right comission", async function () {
      const { nodeRewardVault } = await loadFixture(deployBaseFixture);
      await nodeRewardVault.setComission(0);

      expect(await nodeRewardVault.comission()).to.equal(0);
    });

    it("Should revert & not set the comission", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);

      await expect(nodeRewardVault.connect(otherAccount).setComission(999)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(nodeRewardVault.setComission(10000)).to.be.revertedWith("Comission cannot be 100%");
      await expect(nodeRewardVault.setComission(100000)).to.be.revertedWith("Comission cannot be 100%");
    });
  });

  describe("Tax settings", function () {
    it("Should have the right tax", async function () {
      const { nodeRewardVault } = await loadFixture(deployBaseFixture);

      expect(await nodeRewardVault.tax()).to.equal(0);
    });

    it("Should set the right tax", async function () {
      const { nodeRewardVault } = await loadFixture(deployBaseFixture);
      await expect(nodeRewardVault.setTax(10)).to.emit(nodeRewardVault, "TaxChanged").withArgs(0, 10);

      expect(await nodeRewardVault.tax()).to.equal(10);
    });

    it("Should revert & not set the tax", async function () {
      const { nodeRewardVault, otherAccount } = await loadFixture(deployBaseFixture);

      await expect(nodeRewardVault.connect(otherAccount).setTax(999)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(nodeRewardVault.setTax(10000)).to.be.revertedWith("Tax cannot be 100%");
      await expect(nodeRewardVault.setTax(100000)).to.be.revertedWith("Tax cannot be 100%");
    });
  });

  describe("Transfer and rewards", function () {
    it("Should have the right balance", async function () {
      const { nodeRewardVault } = await loadFixture(deployRewardFixture);

      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should not be able to transfer", async function () {
      const { nodeRewardVault, owner } = await loadFixture(deployRewardFixture);

      await expect(nodeRewardVault.transfer(ethers.utils.parseEther("100"), owner.address)).to.be.revertedWith(
        "Not allowed to touch funds"
      );
    });

    it("Should not have rewards", async function () {
      const { nodeRewardVault } = await loadFixture(deployRewardFixture);

      expect(await nodeRewardVault.rewards(0)).to.equal(0);
    });
  });
});
