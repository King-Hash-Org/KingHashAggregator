import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Address, zeroAddress } from "ethereumjs-util";
import { AddressZero } from "@ethersproject/constants";

describe("ValidatorNft", function () {
  async function deployBaseFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

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
    rocketStorage.setAddressStorage("0x65DD923DDFC8D8AE6088F80077201D2403CBD565F0BA25E09841E2799EC90BB2", rocketDepositPoolContract.address ) ;
    rocketStorage.setAddressStorage("0xE3744443225BFF7CC22028BE036B80DE58057D65A3FDCA0A3DF329F525E31CCC", rocketTokenRETH.address ) ;

    await rocketDepositPoolContract.setRocketAddress(rocketTokenRETH.address) ;

    const RocketControllerContract = await ethers.getContractFactory("RocketController");
    const rocketController = await RocketControllerContract.deploy();
    await rocketController.initialize();
    
    const Aggregator = await ethers.getContractFactory("Aggregator");
    const aggregator = await Aggregator.deploy();
    await aggregator.initialize( depositContract.address, nodeRewardVault.address, nftContract.address, lidoContract.address , lidoController.address, rocketStorage.address , rocketController.address );

    await nftContract.setAggregator(aggregator.address);
    await nftContract.setNodeRewardVault(nodeRewardVault.address);
    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  // fixture with owner as aggregator stub
  async function deployAggregatorStubFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployBaseFixture();

    await nftContract.setAggregator(owner.address);

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  // fixture with minted nfts
  async function deployMintedFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployAggregatorStubFixture();

    const pubkey = "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";
    const pubkey2 =
      "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebe";

    await nftContract.whiteListMint(pubkey, owner.address);
    await nftContract.whiteListMint(pubkey2, owner.address);

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  // fixture with minted nfts by aggregator
  async function deployMintedWithAggregatorFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployBaseFixture();

    const data =
      "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
    await aggregator.stake([data], { value: ethers.utils.parseEther("32") });

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  // fixture with rewards
  async function deployMintedWithRewardsFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployMintedWithAggregatorFixture();

    await owner.sendTransaction({
      to: nodeRewardVault.address,
      value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
    });

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  describe("Aggregator setting", function () {
    it("Should have the right default authority", async function () {
      const { aggregator, nftContract } = await loadFixture(deployBaseFixture);

      expect(await nftContract.aggregatorProxyAddress()).to.equal(aggregator.address);
    });
  });

  describe("Withdrawal setting", function () {
    it("Should be only owner allowed to withdraw", async function () {
      const { nftContract, otherAccount } = await loadFixture(deployBaseFixture);

      await nftContract.withdrawMoney(otherAccount.address);
      await expect(nftContract.connect(otherAccount).withdrawMoney(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Base uri setting", function () {
    it("Should be only owner allowed to withdraw", async function () {
      const { nftContract } = await loadFixture(deployMintedFixture);

      await nftContract.setBaseURI("www.chainupcloud.com/");
      expect(await nftContract.tokenURI(0)).to.equal("www.chainupcloud.com/0");
      expect(await nftContract.tokenURI(1)).to.equal("www.chainupcloud.com/1");
    });
  });

  describe("Mint", function () {
    it("Unauthorized aggregator mint", async function () {
      const { nftContract, owner, otherAccount } = await loadFixture(deployAggregatorStubFixture);
      const pubkey =
        "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";

      await expect(nftContract.connect(otherAccount).whiteListMint(pubkey, owner.address)).to.be.revertedWith(
        "Not allowed to mint/burn nft"
      );
    });

    it("Correct authorized aggregator mint", async function () {
      const { nftContract, owner } = await loadFixture(deployAggregatorStubFixture);
      const pubkey =
        "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";

      await nftContract.whiteListMint(pubkey, owner.address);
      expect(await nftContract.validatorOf(0)).to.equal(pubkey);
      expect(await nftContract.ownerOf(0)).to.equal(owner.address);
      expect(await nftContract.tokensOfOwner(owner.address)).to.have.deep.members([ethers.utils.parseEther("0")]);
      expect(await nftContract.validatorsOfOwner(owner.address)).to.have.same.members([pubkey]);
      expect(await nftContract.validatorExists(pubkey)).to.equal(true);
      expect(await nftContract.activeValidators()).to.have.same.members([pubkey]);

      // total height should be same as gas height as there is only 1 nft
      const totalHeight = await nftContract.totalHeight();
      expect(totalHeight).to.greaterThanOrEqual(ethers.utils.parseEther("0"));
      expect(await nftContract.gasHeightOf(0)).to.equal(totalHeight);
    });
  });

  describe("Multi mint", function () {
    it("Incorrect duplicated mint", async function () {
      const { nftContract, owner } = await loadFixture(deployAggregatorStubFixture);
      const pubkey =
        "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";

      await nftContract.whiteListMint(pubkey, owner.address);

      await expect(nftContract.whiteListMint(pubkey, owner.address)).to.be.revertedWith("Pub key already in used");
      expect(await nftContract.numberMinted(owner.address)).to.equal(1);
    });

    it("Correct multi mint", async function () {
      const { nftContract, owner } = await loadFixture(deployAggregatorStubFixture);
      const pubkey =
        "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";
      const pubkey2 =
        "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebe";

      await nftContract.whiteListMint(pubkey, owner.address);
      await nftContract.whiteListMint(pubkey2, owner.address);
      expect(await nftContract.validatorOf(0)).to.equal(pubkey);
      expect(await nftContract.ownerOf(0)).to.equal(owner.address);
      expect(await nftContract.tokenOfValidator(pubkey)).to.equal(0);
      expect(await nftContract.validatorOf(1)).to.equal(pubkey2);
      expect(await nftContract.ownerOf(1)).to.equal(owner.address);
      expect(await nftContract.tokenOfValidator(pubkey2)).to.equal(1);
      expect(await nftContract.tokensOfOwner(owner.address)).to.have.deep.members([
        ethers.utils.parseEther("0"),
        ethers.utils.parseUnits("1", 0),
      ]);
      expect(await nftContract.validatorsOfOwner(owner.address)).to.have.same.members([pubkey, pubkey2]);
      expect(await nftContract.validatorExists(pubkey)).to.equal(true);
      expect(await nftContract.validatorExists(pubkey2)).to.equal(true);
      expect(await nftContract.numberMinted(owner.address)).to.equal(2);
      expect(await nftContract.activeValidators()).to.have.same.members([pubkey, pubkey2]);
    });
  });

  describe("Mint & burn", function () {
    it("Unauthorized aggregator burn", async function () {
      const { nftContract, otherAccount } = await loadFixture(deployMintedFixture);

      await expect(nftContract.connect(otherAccount).whiteListBurn(0)).to.be.revertedWith(
        "Not allowed to mint/burn nft"
      );
    });

    // not possible to test as rewards is now issued when burn
    it.skip("Correct authorized burn", async function () {
      const { nftContract, owner } = await loadFixture(deployMintedFixture);

      expect(await nftContract.totalSupply()).to.equal(2);
      await expect(nftContract.whiteListBurn(0))
        .to.emit(nftContract, "Transfer")
        .withArgs(owner.address, AddressZero, 0);
      expect(await nftContract.totalSupply()).to.equal(1);
      expect(await nftContract.tokensOfOwner(owner.address)).to.have.deep.members([ethers.utils.parseUnits("1", 0)]);
    });

    // not possible to test as rewards is now issued when burn
    it.skip("Dual burn", async function () {
      const { nftContract, owner } = await loadFixture(deployMintedFixture);

      await expect(nftContract.whiteListBurn(0))
        .to.emit(nftContract, "Transfer")
        .withArgs(owner.address, AddressZero, 0);
      await expect(nftContract.whiteListBurn(0)).to.be.revertedWithCustomError(
        nftContract,
        "OwnerQueryForNonexistentToken"
      );
    });
  });

  describe("Set opensea proxy", function () {
    it("Should set", async function () {
      const { nftContract } = await loadFixture(deployBaseFixture);

      await expect(nftContract.setIsOpenSeaProxyActive(true))
        .to.emit(nftContract, "OpenSeaState")
        .withArgs(true);
    });

    it("Should unset", async function () {
      const { nftContract } = await loadFixture(deployBaseFixture);

      await expect(nftContract.setIsOpenSeaProxyActive(false))
        .to.emit(nftContract, "OpenSeaState")
        .withArgs(false);
    });

    it("Should be unathourized", async function () {
      const { nftContract, otherAccount } = await loadFixture(deployBaseFixture);

      await expect(nftContract.connect(otherAccount).setIsOpenSeaProxyActive(true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
