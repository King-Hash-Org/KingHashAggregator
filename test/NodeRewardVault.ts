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
    const LidoContract = await ethers.getContractFactory("Lido");
    const lidoContract = await LidoContract.deploy();

    const LidoControllerContract = await ethers.getContractFactory("LidoController");
    const lidoController = await LidoControllerContract.deploy();

    const RocketDepositPoolContract = await ethers.getContractFactory("RocketDepositPool");
    const rocketDepositPoolContract = await RocketDepositPoolContract.deploy();

    const RocketTokenRETHContract = await ethers.getContractFactory("RocketTokenRETH");
    const rocketTokenRETH = await RocketTokenRETHContract.deploy();

    const RocketStorageContract = await ethers.getContractFactory("RocketStorage");
    const rocketStorage = await RocketStorageContract.deploy();

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
  async function deployExistingValidatorFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployBaseFixture();

    const data =
      "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
    await aggregator.stake([data], { value: ethers.utils.parseEther("32") });

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

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

  describe("Minting Nft", function () {
    it("Missing data behaviour", async function () {
      const { aggregator } = await loadFixture(deployBaseFixture);
      const data = "0x01";
      await expect(aggregator.stake([data])).to.be.revertedWith("Eth32 Contract: Invalid Data Length");
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("1") })).to.be.revertedWith(
        "Eth32 Contract: Invalid Data Length"
      );
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("32") })).to.be.revertedWith(
        "Eth32 Contract: Invalid Data Length"
      );
    });

    it("Correct data behaviour", async function () {
      const { aggregator, owner, nftContract } = await loadFixture(deployBaseFixture);
      const data1 =
        "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
      const pubkey =
        "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";
      const withdrawalCredentials = "0x00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a";

      // single data
      expect(await aggregator.callStatic.stake([data1], { value: ethers.utils.parseEther("32") })).to.be.equal(true);
      await expect(aggregator.stake([data1])).to.be.revertedWithoutReason();
      await expect(aggregator.stake([data1], { value: ethers.utils.parseEther("1") })).to.be.revertedWithoutReason();
      await expect(aggregator.stake([data1], { value: ethers.utils.parseEther("33") })).to.be.revertedWith(
        "Incorrect Ether amount provided"
      );

      // multi data
      const data2 =
        "0x011c0000000000000000000000000000b0917fe7ef834819712d3bc5cbb37fb89b49a6149b573bf07f28059b6560d575ff09a44980bf9b0a37febc0a979b2a01001c1e94882d5f461636f3ac314986165027497c9a48a0f1bdaa9147fdd09470a9e48de9f5bf75fbc9847d2ffa51be36a8377cce0509f83a05bcb7b4507668d665d2e25309ed9880f57ba372b87c3e5817fb8ce289e0a22c655762145c0300d00afe9ebf83ccbd54e8110ad5980f67165fd26d290b9aa50f0f7c49619d587196b84839697afc4e347e943d9472abb000f37c0e61679fb31105d46340d0291aab0000000000000000000000000000000000000000000000000000000006e1752c7ac4d1706a72cf62bd12f89eceead45f07a5325010f3c11cbac71d6cca9c9ba7dc46f6f7bdeaa3fcaf011ad4891ad608ac9bbf5c1400d72df0358e81db53d7d7";
      expect(await aggregator.callStatic.stake([data1, data2], { value: ethers.utils.parseEther("64") })).to.be.equal(
        true
      );
      await expect(aggregator.stake([data1, data2])).to.be.revertedWithoutReason();
      await expect(
        aggregator.stake([data1, data2], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWithoutReason();
      await expect(aggregator.stake([data1], { value: ethers.utils.parseEther("65") })).to.be.revertedWith(
        "Incorrect Ether amount provided"
      );

      // Test mint Nft, Eth32Deposit event should emit
      await expect(aggregator.stake([data1], { value: ethers.utils.parseEther("32") }))
        .to.emit(aggregator, "Eth32Deposit")
        .withArgs(pubkey, withdrawalCredentials, owner.address);

      expect(await nftContract.ownerOf(0)).to.be.equal(owner.address);
      await expect(nftContract.ownerOf(1)).to.be.revertedWithCustomError(nftContract, "OwnerQueryForNonexistentToken");
    });

    it("Malformed data behaviour", async function () {
      const { aggregator } = await loadFixture(deployBaseFixture);

      // Incorrect blockheight
      const incorrectBlockHeightData1 =
        "0x011b00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb3338500000000000000000000000000000000000000000000000000000000000000001e643e646cae21adf6df3123d4c6660dc2f12e1cad74f9e32aead111409179a45584bc2ba300752ae9236eeed44f03b28dd2f2efcb4f37c41b091fa126a88d42";
      const incorrectBlockHeightData2 =
        "0x011b00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb3338500000000000000000000000000000000000000000000000000000000000000051e643e646cae21adf6df3123d4c6660dc2f12e1cad74f9e32aead111409179a45584bc2ba300752ae9236eeed44f03b28dd2f2efcb4f37c41b091fa126a88d42";
      const incorrectBlockHeightData3 =
        "0x011b00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb3338500000000000000000000000000000000000000000000000000000000000000091e643e646cae21adf6df3123d4c6660dc2f12e1cad74f9e32aead111409179a45584bc2ba300752ae9236eeed44f03b28dd2f2efcb4f37c41b091fa126a88d42";

      await expect(
        aggregator.stake([incorrectBlockHeightData1], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Block height too old, please generate a new transaction");
      await expect(aggregator.stake([incorrectBlockHeightData1])).to.be.revertedWith(
        "Block height too old, please generate a new transaction"
      );
      await expect(
        aggregator.stake([incorrectBlockHeightData2], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Block height too old, please generate a new transaction");
      await expect(
        aggregator.stake([incorrectBlockHeightData3], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Block height too old, please generate a new transaction");

      // Incorrect authority
      const incorrectAuthorityData =
        "0x011b00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c04879f4ab43ec7bee7818a71920693199540df0d316f12fbfcd41012e1f32a0d12e36c0fe1a9080bf24db799b91c3474527e096839e8d0fc086940aee502f1f7";
      await expect(aggregator.stake([incorrectAuthorityData])).to.be.revertedWith(
        "Not authorized"
      );
      await expect(
        aggregator.stake([incorrectAuthorityData], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Not authorized");
      await expect(
        aggregator.stake([incorrectAuthorityData], { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("Not authorized");
      await expect(
        aggregator.stake([incorrectAuthorityData], { value: ethers.utils.parseEther("33") })
      ).to.be.revertedWith("Not authorized");

      // Maliciously modifying data
      const modifyWithdrawalCredentialsData =
        "0x011b00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00aa726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c04879f4ab43ec7bee7818a71920693199540df0d316f12fbfcd41012e1f32a0d12e36c0fe1a9080bf24db799b91c3474527e096839e8d0fc086940aee502f1f7";
      await expect(aggregator.stake([modifyWithdrawalCredentialsData])).to.be.revertedWith(
        "Not authorized"
      );
      await expect(
        aggregator.stake([modifyWithdrawalCredentialsData], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Not authorized");
    });

    it("Existing validator data behaviour", async function () {
      const { aggregator } = await loadFixture(deployBaseFixture);

      const data =
        "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
      await aggregator.stake([data], { value: ethers.utils.parseEther("32") });
      await expect(aggregator.stake([data])).to.be.revertedWith("Pub key already in used");
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("32") })).to.be.revertedWith(
        "Pub key already in used"
      );
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("1") })).to.be.revertedWith(
        "Pub key already in used"
      );
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("33") })).to.be.revertedWith(
        "Pub key already in used"
      );
    });

    it("Should fetch validator nodes", async function () {
      const { owner, otherAccount, nftContract } = await loadFixture(deployExistingValidatorFixture);
      const pubkey =
        "0x8752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf";

      expect(await nftContract.callStatic.validatorOf(0)).to.be.equal(pubkey);
      expect(await nftContract.callStatic.validatorsOfOwner(owner.address)).to.have.same.members([pubkey]);
      expect(await nftContract.callStatic.validatorsOfOwner(otherAccount.address)).to.have.same.members([]);

      expect(await nftContract.callStatic.ownerOf(0)).to.be.equal(owner.address);
    });
  });

  // describe("Transfer and rewards", function () {
  //   it("Should have the right balance", async function () {
  //     const { nodeRewardVault } = await loadFixture(deployRewardFixture);

  //     expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("100"));
  //   });

  //   it("Should not have rewards", async function () {
  //     const { nodeRewardVault } = await loadFixture(deployRewardFixture);

  //     const reward = await nodeRewardVault.rewards(0);
  //     expect(reward).to.be.equal(ethers.utils.parseEther("0"));

  //     await nodeRewardVault.setSettleBlockLimit(20000);
  //     expect(await nodeRewardVault._settleBlockLimit()).to.equal(20000);

  //     await network.provider.send("hardhat_mine", ["0x2710"]);

  //     const latestBlock = await ethers.provider.getBlock("latest")

  //     await expect(nodeRewardVault.settle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock.number+1, ethers.utils.parseEther("100"));

  //     await expect(nodeRewardVault.settle()).to.be.revertedWith(
  //       "settle interval is too short"
  //     );
      
  //     await network.provider.send("hardhat_mine", ["0x4e20"]);
  //     await expect(nodeRewardVault.settle()).to.be.revertedWith(
  //       "no settle amount"
  //     );
  //   });
  // });

  describe("rewards and withdrawReward", function () {
    it("Should have the right balance", async function () {
      const { nodeRewardVault } = await loadFixture(deployRewardFixture);

      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should have rewards", async function () {
      const { nodeRewardVault } = await loadFixture(deployRewardFixture);

      const reward = await nodeRewardVault.rewards(0);
      expect(reward).to.be.equal(ethers.utils.parseEther("0"));

      await nodeRewardVault.setSettleBlockLimit(20000);
      expect(await nodeRewardVault._settleBlockLimit()).to.equal(20000);

      await network.provider.send("hardhat_mine", ["0x2710"]);

      const latestBlock = await ethers.provider.getBlock("latest")

      await expect(nodeRewardVault.settle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock.number+1, ethers.utils.parseEther("100"));

      await nodeRewardVault.withdrawReward(0);
    });
});
});
