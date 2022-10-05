import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Address, zeroAddress } from "ethereumjs-util";
import { AddressZero } from "@ethersproject/constants";
import { tradeRouteDataV2 } from "./helper";
import { utils } from "../typechain-types/@openzeppelin/contracts-upgradeable";

describe("Aggregator", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployBaseFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, authority, anotherAccount ] = await ethers.getSigners();

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
    
    await lidoController.addAllowList(aggregator.address);
    await nodeRewardVault.setAggregator(aggregator.address);
    await nftContract.setAggregator(aggregator.address);


    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount, anotherAccount , authority, lidoController, rocketController };
  }

  async function deployExistingValidatorFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployBaseFixture();

    const data =
      "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
    await aggregator.stake([data], { value: ethers.utils.parseEther("32") });

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  async function deployExistingValidatorsFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount, authority } = await deployBaseFixture();

    const data =
      "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
    const data1 = 
      "0x011c000000000000000000000000000093d9f1e58ab7cf478d35f1661c59a841eb3a1c627e55b3ecdaf8aa7d2999e8d5c5aae5af3834d8244f2501d16f7a40ad010000000000000000000000bb5b420f1d3967756d4e46f830e1ca142e1e0545a6eb199e52568df716ebb2d4a4a7638c86737b4f39f9a1776f39d6488f8c0b73946e66575cb50e49e58d1867890b48b311ff2784dc18b2a7087cf199ed980c137c8e8f6b4ac4a07b182533a3d462385d14ea8cc560e32e0bc005c0eb71bc634e67ff826e8d32f2967db660f6361036e6d9f129693741ecbf03ebd8084961ebb10000000000000000000000000000000000000000000000000000000006e1752c2a13a5bd053923eb63463474deeef9aff43294971c6d10a262eb0421f71717d9dee9b45d60bb7d8a97113dc6d094cbc0bd03ad2a50fa7aab3d3b40fb80e249e9";
    const data2 =
      "0x011b0000000000000000000000000000a9b8c5e5ba5ff379c3216f8e09154b3cf56dee608eabfb24ef7d3dd99d4a6cba34bfde5c493c8e05ee942a3d705ab2c3002fa1256542629e76418786502f8dc5b78703c89e53f3aae3c5ed5708b7ffa8954fb880517ad78212a580fc50cfb761450ae93fe2f44d3b50c7b039d21e59bdef3ec4cb2e300f1bc2eb205d263e129015198918ff8853e7535e188ccb678967fd48a2d7f1206fbdcc6cc529c15cf598554425d84039c7ecb9cb2f2a69943bc6e06833af98caa3051a4eb4f887db982dc7048c3d40a8b9bf64edcf2fd621bfe20000000000000000000000000000000000000000000000000000000006e1752c3e8788a4ff23fda9506b559056f0646d0c5fae1c5479a0a828ea0a03568068303723646e88de0e5ecbb31c9cb8744b0f70eae53f68dfdc5bdfa713dd61336cd2";
    const data3 = 
      "0x011c000000000000000000000000000086ce949d229effaf0487577a24a98b336d35da5fe3ead525f02c62cdce162c3d0c8b9fef079e74a23510b719d4e973b0010000000000000000000000bb5b420f1d3967756d4e46f830e1ca142e1e0545ac5eaf2ae6de79a149f94c48e07cb334c112a362c96fb76917ffe55b2130da88c39fcf418b1b06d7d606874d69bcf667013c41f4cf7ed8f06e84c7fbf4f8fcbd0906cdf2875a15e144fa5fb8dbd0c8793254598553aabc21b54c9c4f4580456abf65a725024fa14745d02122d810ec1fe75d9c464e787c09eff16fe998cc09c20000000000000000000000000000000000000000000000000000000006e1752c5b499492c34bd2f1b1f57cd2480bca7f3c88f224f501713b462ce72e198661f90c830f6337cb8db9eb3320ed370c62d70a9f46153b9a0f4f7cf2544ce7c894aa";
    await aggregator.stake([data, data1, data2, data3], { value: ethers.utils.parseEther("128") });

    await nodeRewardVault.setAuthority(authority.address);

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount, authority };
  }

  async function deployExistingRewardFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployExistingValidatorFixture();

    await owner.sendTransaction({
      to: nodeRewardVault.address,
      value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
    });

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should have the right nft address", async function () {
      const { aggregator, nftContract } = await loadFixture(deployBaseFixture);

      expect(await aggregator.nftAddress()).to.equal(nftContract.address);
    });
  });

  describe("Empty function calls", function () {
    it("Empty array stake behaviour", async function () {
      const { aggregator } = await loadFixture(deployBaseFixture);

      expect(await aggregator.callStatic.stake([])).to.equal(true);
      await expect(aggregator.stake([], { value: ethers.utils.parseEther("1") })).to.be.rejectedWith(
        "Incorrect Ether amount provided"
      );
      await expect(aggregator.stake([], { value: ethers.utils.parseEther("32") })).to.be.rejectedWith(
        "Incorrect Ether amount provided"
      );
    });

    it("Empty data stake behaviour", async function () {
      const { aggregator } = await loadFixture(deployBaseFixture);
      const data = "0x";

      await expect(aggregator.stake([data])).to.be.revertedWith("Empty data provided");
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("1") })).to.be.revertedWith(
        "Empty data provided"
      );
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("32") })).to.be.revertedWith(
        "Empty data provided"
      );
    });

    it("Empty array unstake behaviour", async function () {
      const { aggregator } = await loadFixture(deployBaseFixture);

      expect(await aggregator.callStatic.unstake([])).to.equal(true);
    });

    it("Empty data unstake behaviour", async function () {
      const { aggregator } = await loadFixture(deployBaseFixture);
      const data = "0x";

      expect(await aggregator.callStatic.unstake([data])).to.equal(false);
    });
  });

  describe("Pausing", function () {
    it("After pause & unpause", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployBaseFixture);

      expect(aggregator.connect(otherAccount).callStatic.pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(aggregator.pause()).to.emit(aggregator, "Paused");
      await expect(aggregator.stake([])).to.be.revertedWith("Pausable: paused");
      await expect(aggregator.unstake([])).to.be.revertedWith("Pausable: paused");

      await expect(aggregator.unpause()).to.emit(aggregator, "Unpaused");
      expect(await aggregator.callStatic.stake([])).to.equal(true);
      expect(await aggregator.callStatic.unstake([])).to.equal(true);
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

  describe("Testing for Lido Stake", function () {
    
    it("Correct data behaviour for Lido Stake", async function () {
      const { aggregator, owner , lidoController, otherAccount } = await deployBaseFixture();
      await lidoController.addAllowList(aggregator.address);

      const data1 = "0x02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001BC16D674EC80000"; //2 ether
      const data2 = "0x0200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001C9F78D2893E40000"; //33 ether
      const data3 = "0x0200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000DE0B6B3A76400000"; //16 ether

      // Test Lido Stake Router
      expect(await aggregator.callStatic.stake([data1], { value: ethers.utils.parseEther("2")})).to.be.equal(true);
      expect(await aggregator.callStatic.stake([data2], { value: ethers.utils.parseEther("33")})).to.be.equal(true);
      expect(await aggregator.callStatic.stake([data3], { value: ethers.utils.parseEther("16")})).to.be.equal(true);

      // Test LidoDeposit event emit
      expect(await aggregator.stake([data1], { value: ethers.utils.parseEther("2") })).to.emit(aggregator, "LidoDeposit").withArgs( owner.address , ethers.utils.parseEther("2") );
      expect(await aggregator.stake([data2], { value: ethers.utils.parseEther("33") })).to.emit(aggregator, "LidoDeposit").withArgs( owner.address , ethers.utils.parseEther("33") );
      expect(await aggregator.stake([data3], { value: ethers.utils.parseEther("16") })).to.emit(aggregator, "LidoDeposit").withArgs( owner.address , ethers.utils.parseEther("16") );

      //multidata
      expect(await aggregator.callStatic.stake([data1, data2, data3], { value: ethers.utils.parseEther("51")})).to.be.equal(true);
      expect(await aggregator.stake([data1, data3], { value: ethers.utils.parseEther("18")})) ;
      
      // test AllowList and get/addStEthShares
      await aggregator.stake([data1], { value: ethers.utils.parseEther("2")});
      const stEthShare1 = await lidoController.getStEthShares( owner.address );  
      const stEthShare2 = ethers.utils.formatUnits(stEthShare1, 18) ;
      await expect(stEthShare2).to.equal("71.0");

    });

    it("Wrong data behaviour for Lido Stake", async function () {
      const { aggregator, owner , lidoController  } = await deployBaseFixture();
      await lidoController.addAllowList(aggregator.address);

      const data1 = "0x02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"; //0 ether
      // // Test Lido Stake Router
      await expect(aggregator.stake([data1] )).to.be.revertedWith("Deposit must not be zero or must be minumum 1 wei");
      await expect(aggregator.stake([data1]  , { value: ethers.utils.parseEther("1") } )).to.be.revertedWith("Deposit must not be zero or must be minumum 1 wei");
      await expect(aggregator.stake([data1]  , { value: ethers.utils.parseEther("33") } )).to.be.revertedWith("Deposit must not be zero or must be minumum 1 wei");
    
      const data2 = "0x0200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001C9F78D2893E40000"; //33 ether
      await expect(aggregator.stake([data2] , { value: ethers.utils.parseEther("1") } )).to.be.revertedWith("Stake amount is not enough!");
      await expect(aggregator.stake([data2]  )).to.be.revertedWith("Stake amount is not enough!");

      const data3 = "0x02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004563918244F40000"; //5 ether
      await expect(aggregator.stake([data3] , { value: ethers.utils.parseEther("1") } )).to.be.revertedWith("Stake amount is not enough!");
      const data4 = "0x020000004563918244F40000"; // too short data length
      await expect(aggregator.stake([data4] )).to.be.revertedWith("LidoContract: invalid data.length");
      const data5 = "0x02000000000000000000000000000000000000000000000001C9F78D2893E4000012441312"; // too long data length
      await expect(aggregator.stake([data5] )).to.be.revertedWith("LidoContract: invalid data.length");

      // case whereby there is more ether than expected
      

      // multidata

      // malformed data-> too short or too long
      
      // try different sizes of ether, try 1 wei, try 10000 eth
      await lidoController.removeAllowList(aggregator.address ) ;
      await expect(lidoController.removeAllowList("0x0000000000000000000000000000000000000000" )).to.be.revertedWith("User should not be zero address"); 
      await  expect(lidoController.addStEthShares( owner.address , ethers.utils.parseEther("2") ) ).to.be.revertedWith("Not allowed to add SETH Shares Balance");

    });

  });

  describe("Testing for Rocket Stake", function () {
    
    it("Correct data behaviour for Rocket Stake", async function () {
      const { aggregator ,rocketController, owner } = await deployBaseFixture();
      await rocketController.addAllowList(aggregator.address);

      const data1 = "0x04000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001BC16D674EC80000"; //2 ether 
      const data2 = "0x0400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001C9F78D2893E40000"; //33 ether
      const data3 = "0x0400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000DE0B6B3A76400000"; //16 ether
      // Test  Rocket Stake Router
      expect(await aggregator.callStatic.stake([data1], { value: ethers.utils.parseEther("2")})).to.be.equal(true);
      expect(await aggregator.callStatic.stake([data2], { value: ethers.utils.parseEther("33")})).to.be.equal(true);
      expect(await aggregator.callStatic.stake([data3], { value: ethers.utils.parseEther("16")})).to.be.equal(true);

      // test AllowList and get/addStEthShares
      await aggregator.stake([data1], { value: ethers.utils.parseEther("2")});
      const rEthShare1 = await rocketController.getREthBalance(owner.address );  
      await expect( ethers.utils.formatUnits(rEthShare1, 18)).to.equal("1.9999999999999999");

      await aggregator.stake([data3], { value: ethers.utils.parseEther("16")});
      const rEthShare = await rocketController.getREthBalance(owner.address );  
      await expect(ethers.utils.formatUnits(rEthShare, 18)).to.equal("17.9999999999999998");
    });

    it("Wrong Behavior for RocketPool Stake", async function () {
      const { aggregator, rocketController, owner  } = await deployBaseFixture();
      await rocketController.addAllowList(aggregator.address ) ;
      const data = "0x040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038D7EA4C68000";
      // Test  Rocket Stake Router
      await expect(aggregator.stake([data])).to.be.revertedWith("The deposited amount is less than the minimum deposit size");
      await expect(aggregator.stake([data], { value: ethers.utils.parseEther("0.001")})).to.be.revertedWith("The deposited amount is less than the minimum deposit size");
    it("Should fail as listing expired", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061c0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8bbf79a406ce578ca38af6efc0a1a63e8e1a8e6db3a33c79b3d0e368882736bab17a3a939989d02cf15dd03df30eb58dd943492dc8e29226059981303c08958a3000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000015be34ca407fc60edc877b777ad2cd6c7ffdc93767e80463ffb3d18aba2d1783364e97ba353a892eeffae7c4f8bfa458005934ae9ff6338a8afeffb55089227b8f39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Listing has expired");
    });

    it("Should fail as trade expired", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C81da67b2920aa7ad00432add2e80f06a5134557bee5d7a883f26a281d1826e5396b3cba8a8c1565943e0c6738cdf4d5cd84f9b84c2b5ee418a41ac3bc5734d38300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000015be34ca407fc60edc877b777ad2cd6c7ffdc93767e80463ffb3d18aba2d1783364e97ba353a892eeffae7c4f8bfa458005934ae9ff6338a8afeffb55089227b8f39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Trade has expired");
    });

    it("Should fail as incorrect nonce", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061c0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8eae0115007c4a58a7b3103a2c1db0cc94cb37df760dfb91f85d60fc04be7bbc854e556a738910558d23e3787d25347fe2b50145751b685e11c22ba9b32af0f63000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f4802a45e5f127208d9fbc5ea62bb0b812206cd6e1884fb7af80b7f9087f49c179e209e33d251fe7a87505e16f4da54931a7f051ee110f8dd9ae62555f88f345926ef39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000001";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Incorrect nonce");
    });

    it("Should fail as incorrect user signature", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8275f149a169ae15e717c6ed4752d836a282c43b0a0d175e3df8a160fe4027b0022530890d34cbd72c48c25cb683dcb19c546c554cea47fe8c86964bcaf381e2c000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f4804a4c5b548fb9400fd5414873f57283646ae1300e3eac24c507c644f6be84a6585b475db111442a5c4c12fba52d0b8672f6dd3437a93cdc478f35e68c806aba3df39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail as incorrect authority signature", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C87da9c646508bcb440b3584e96ecb47e47bea5215c4fd18fb01733dff830d21ff2c2c9ff815b04d33695f5beb00acfdd8be61a8ad3cf6ba414b017d51e851b53d000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail as incorrect buyer signature", async function () {
      const { aggregator } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8792bc6535fe593562c14dcb72f234f461a4412f60423a3811ff87ef4aa96218c74a4b13c9b83e291ee6f04d0d7b38b2c454e01fc3ff286e7a971a3fa141cac41000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000";
      await expect(
        aggregator.stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Not allowed to make this trade");
    });

    it("Should fail as buyer try to spoof", async function () {
      const { aggregator } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b00000000000000000000f39Fd6e51aad88F6F4ce6aB8827279cffFb92266792bc6535fe593562c14dcb72f234f461a4412f60423a3811ff87ef4aa96218c74a4b13c9b83e291ee6f04d0d7b38b2c454e01fc3ff286e7a971a3fa141cac41000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000";                           
      await expect(
        aggregator.stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail as node too cheap", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061c0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8f4d10ab540e4d18239fa2f6ae630686481619d1f7eeeeb8138b26d46709ea5261bbe22d7e1e6e68d9887799305d7cf92e028b6e4022cd0c8dfc9b8b36c1d7306000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001a055690d9db800000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000";                           
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.revertedWith("Node too cheap");
    });

    it("Should succeed with 32eth price", async function () {
      const { aggregator, nftContract, otherAccount, owner } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8792bc6535fe593562c14dcb72f234f461a4412f60423a3811ff87ef4aa96218c74a4b13c9b83e291ee6f04d0d7b38b2c454e01fc3ff286e7a971a3fa141cac41000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001bc16d674ec8000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000";
      expect(
        await aggregator.connect(otherAccount).callStatic.stake([data], { value: ethers.utils.parseEther("32") })
      ).to.be.equals(true);
      const before = await ethers.provider.getBalance(owner.address);
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("32") })
      ).to.emit(aggregator, "NodeTrade").withArgs("1", owner.address, otherAccount.address, ethers.utils.parseEther("32"));
      expect(
        await nftContract.callStatic.ownerOf(1)
      ).to.be.equals(otherAccount.address);
      const after = await ethers.provider.getBalance(owner.address);
      expect(after.sub(before)).equal(ethers.utils.parseEther("32"));
    });

    it("Should succeed with 33eth price", async function () {
      const { aggregator, nftContract, nodeRewardVault, otherAccount, owner } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061c0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C89469dc051d8cf13daa23e1b979c7a974769f93dd92a17a0721cedefe70f79a2150dbd7bec3cd42e72b769cd927e1629b6cad396d1e6098ecd08bc137fea87cf7000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000";
      const before = await ethers.provider.getBalance(owner.address);
      const beforeDao = await ethers.provider.getBalance(nodeRewardVault.dao());
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("33") })
      ).to.emit(aggregator, "NodeTrade").withArgs("1", owner.address, otherAccount.address, ethers.utils.parseEther("33"));
      expect(
        await nftContract.callStatic.ownerOf(1)
      ).to.be.equals(otherAccount.address);
      const after = await ethers.provider.getBalance(owner.address);
      const afterDao = await ethers.provider.getBalance(nodeRewardVault.dao());
      expect(after.sub(before)).equal(ethers.utils.parseEther("32.9"));
      expect(afterDao.sub(beforeDao)).equal(ethers.utils.parseEther("0.1"));
    });
  });
  });
  describe("Trading mutliple nfts", function () {
    it("Should fail as price incorrect", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8ab861166d0d50f8af2c2ec1108030cbb594caa0536af22a7cc11e9b46a720f36278404d1cede8dd2606128d2160813b17b25ff88ff98b8763fad2e4c6980ed07000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d4f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data])
      ).to.be.revertedWithoutReason();
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWithoutReason();
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("65") })
      ).to.be.revertedWith("Incorrect Ether amount provided");
    });

    it("Should fail as not owner", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8d2e5242f6f3cf5a7fb16faa09a443c59675ebe88fbb9ad595776c713866a99743bae03150409784d67e2cbcec826ae2dce018950c767a7e698ec05f5707e9c3e000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480b1f5b3c909271280acdad95a9249f2ecfc3f7ad8d6a52b0e933c12c1ef141e203b36bed71b9189daf32f32bba23394e620cf56f628c6f1d1f38b5fbefe6e5ff570997970C51812dc3A010C7d01b50e0d17dc79C81c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Not owner");
    });

    it("Should fail as listing expired", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061c0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C814a5ad41ce417b5d19b6a03b08687bec1f947502fdbbd125d5fa6d8fb02fd018484d372b8cf330d20d45edd764e05b604a0dd95c70254f1bf60027c32cb1c357000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000000000000000000000000000000000000000000000e7cea52d7276c2514b8bf1b39cbe162817e483973e707692e234da63ffb8f4ac24ceed6e831517bdc1bc2afd2f616bac665bdb57577fc27b86e384b3ae03465e70997970C51812dc3A010C7d01b50e0d17dc79C81c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Listing has expired");
    });

    it("Should fail as trade expired", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8ec4856a5f5be5112c6fc67856df564a08b2b04f802a8c19ec04076d45ec43edf162cc30cd2438b7406341e39dbb32c53bf4f5130a746de8442ce22db7bc4a38400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d4f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Trade has expired");
    });

    it("Should fail as incorrect nonce", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8bc37924902dc80215a6284bfccdd8b20574e300befdf587df5efb37bf33f05d11b71aa5491461ab619b1ca13c93376e2d27eb1b64603c8cee45a25707330f976000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e53a7170c261cf642fc1835b6c81a6910d4955db5c08e21e600f1f4cc6029a0e7b1a84f6cf3e310e103cd328196a281d1d0a655985057f857e6d9de530b24640f39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000045";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Incorrect nonce");
    });

    it("Should fail as incorrect user signature", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8ab861166d0d50f8af2c2ec1108030cbb594caa0536af22a7cc11e9b46a720f36278404d1cede8dd2606128d2160813b17b25ff88ff98b8763fad2e4c6980ed07000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d5f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail as incorrect authority signature", async function () {
      const { aggregator, otherAccount } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061c0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C81c538e0ded1f16d0e2c6be2f17128ee0e90e5954d97aa6655226f8b5f842bb7523ef911592837a6c16c962f6d7a2aedcd89b30bbe08639b59a7a3655c3da82c1000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d4f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail as incorrect buyer signature", async function () {
      const { aggregator } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8ab861166d0d50f8af2c2ec1108030cbb594caa0536af22a7cc11e9b46a720f36278404d1cede8dd2606128d2160813b17b25ff88ff98b8763fad2e4c6980ed07000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d4f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Not allowed to make this trade");
    });

    it("Should fail as buyer try to spoof", async function () {
      const { aggregator } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061c00000000000000000000f39Fd6e51aad88F6F4ce6aB8827279cffFb922661a6d0536850790cda4dc1983cd3e22f1e0320ab83d5c130b25f9ff4028330f692c8183a41ea8c7068178924ffae07ce0675bdeacc7d49256b28bea6812246098000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d4f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";                                                    
      await expect(
        aggregator.stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail as length is incorrect", async function () {
      const { aggregator } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8ab861166d0d50f8af2c2ec1108030cbb594caa0536af22a7cc11e9b46a720f36278404d1cede8dd2606128d2160813b17b25ff88ff98b8763fad2e4c6980ed07000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d4f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      await expect(
        aggregator.stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.revertedWithoutReason();
    });

    it("Should succeed", async function () {
      const { aggregator, nftContract, nodeRewardVault, otherAccount, owner } = await loadFixture(deployExistingValidatorsFixture);
      const data = "0x061b0000000000000000000070997970C51812dc3A010C7d01b50e0d17dc79C8ab861166d0d50f8af2c2ec1108030cbb594caa0536af22a7cc11e9b46a720f36278404d1cede8dd2606128d2160813b17b25ff88ff98b8763fad2e4c6980ed07000000000000000000000000000000000000000000000000000000000003f4800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000001c9f78d2893e400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480a109b51003d93d2ad6359e79c96cf109d42dbeb4fe095bca9f81dcfc68abf6b14c974cc5d7831ce8c561672838479957297e4e0d08e44200638b48e55368f0fff39Fd6e51aad88F6F4ce6aB8827279cffFb922661b0000000000000000000000000000000000000000000000000000000000000000000001ae361fc1451c00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000003f480e50cc96833c07ae5307a4a705de326ce181d5df14ecb54f6c2e91a17a4d488dd3ab5de5099ea3a12c96ae450b162ba67b6de466353bcae6a546c80d4f209d00af39Fd6e51aad88F6F4ce6aB8827279cffFb922661c0000000000000000000000";
      const before = await ethers.provider.getBalance(owner.address);
      const beforeDao = await ethers.provider.getBalance(nodeRewardVault.dao());
      expect(
        await aggregator.connect(otherAccount).callStatic.stake([data], { value: ethers.utils.parseEther("64") })
      ).to.be.equals(true);
      await expect(
        aggregator.connect(otherAccount).stake([data], { value: ethers.utils.parseEther("64") })
      ).to.emit(aggregator, "NodeTrade").withArgs("1", owner.address, otherAccount.address, ethers.utils.parseEther("33"));
      expect(
        await nftContract.callStatic.ownerOf(1)
      ).to.be.equals(otherAccount.address);
      expect(
        await nftContract.callStatic.ownerOf(2)
      ).to.be.equals(otherAccount.address);
      const after = await ethers.provider.getBalance(owner.address);
      const afterDao = await ethers.provider.getBalance(nodeRewardVault.dao());
      expect(after.sub(before)).equal(ethers.utils.parseEther("63.9"));
      expect(afterDao.sub(beforeDao)).equal(ethers.utils.parseEther("0.1"));
    });
    
  });``

  describe("Testing for Multi-Stake", function () {
    it("Correct data behaviour for Multi-Stake - Lido, Rocket", async function () {
      const { aggregator, lidoController, rocketController, owner  } = await deployBaseFixture();
      await lidoController.addAllowList(aggregator.address);
      await rocketController.addAllowList(aggregator.address);
      const lidodata1 = "0x02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001BC16D674EC80000"; //2 ether 
      const rocketdata1 = "0x04000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001BC16D674EC80000"; //2 ether 
      const lidodata2 = "0x02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004563918244F40000"; //5 ether 
      const rocketdata2 = "0x04000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004563918244F40000"; //5 ether 

      // Test  Rocket Stake Router
      await aggregator.stake([lidodata1, rocketdata1, lidodata2, rocketdata2 ], { value: ethers.utils.parseEther("14")});
    });

  });


});
