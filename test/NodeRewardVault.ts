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
    
    const withdrawCred = "0x00175ef0acf0386f346cc10b4f25806af2c0b7ec785ef0ae84c4098871340176" ;
    const KingHashLiquidStakingContract = await ethers.getContractFactory("KingHashLiquidStaking");
    const liquidStaking = await KingHashLiquidStakingContract.deploy();
    
    const Aggregator = await ethers.getContractFactory("Aggregator");
    const aggregator = await Aggregator.deploy();
    const chainupOperator = "0xd28ED4D0B1f9bd8dDBd6700b20e7E40889d37898" ;

    await liquidStaking.initLiqStakingVault( withdrawCred, aggregator.address , nftContract.address);
    await aggregator.initialize( depositContract.address, nodeRewardVault.address, nftContract.address, liquidStaking.address, chainupOperator );

    await nodeRewardVault.setAggregator(aggregator.address);
    await nftContract.setAggregator(aggregator.address);

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  async function deployExistingValidatorFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployBaseFixture();
    await nodeRewardVault.setAggregator(aggregator.address);
    await nftContract.setAggregator(aggregator.address);

    const data =
      "0x011c00000000000000000000000000008752fc8b9516d203a8828b0d8e5d8f6122c85ff9daccd8e44e9d6df9a6b6884f491db7cd4a31e51c4bdf7b7dd0c56ebf00ab726d6f3220aa98528fd846fe7b25df6483c0bbe1505ee65e98225e692f9a8eb572bed3850c2984bb2d73ee2e96081814afb6b4ff911cbc471733ee65a8629dfac9e67470886f211dc0c4702cf44c01be9469857231dae5f254e0e698f19efcee0157fc77bee8f48df268e5db163cc744954d24887cc2ecfeb81109f8f1a63e80e9628b4c5cc68045f252b1cf425b3fd3725224bb37c4846ecba70cb333850000000000000000000000000000000000000000000000000000000006e1752c74d6236b57a7c5d40c93f00c6d16a790b88bd29496b0cdd1809befd5464c2cd35655745adc507246b9f9db13d38c3d988fab56b6b752dfc2a2ecbe43dbb0eef3";
    await aggregator.stake([data], { value: ethers.utils.parseEther("32") });

    return { aggregator, nodeRewardVault, nftContract, owner, otherAccount };
  }

  async function deployRewardFixture() {
    const { aggregator, nodeRewardVault, nftContract, owner, otherAccount } = await deployBaseFixture();
    await nodeRewardVault.setAggregator(aggregator.address);
    await nftContract.setAggregator(aggregator.address);

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

  describe("Read rewards metadata", function () {
    it("Should have no rewards", async function () {
      const { nodeRewardVault } = await loadFixture(deployBaseFixture);

      const [rewardsMetdata] = await nodeRewardVault.rewardsAndHeights(1);
      expect(rewardsMetdata.value).equal(ethers.utils.parseUnits("0", 0));
      expect(rewardsMetdata.height).equal(ethers.utils.parseUnits("0", 0));

      expect(await nodeRewardVault.rewardsAndHeights(0)).to.have.members([]);

      const rewards = await nodeRewardVault.rewardsAndHeights(10);
      expect(rewards.length).equal(1);
      expect(rewards[0].value).equal(ethers.utils.parseUnits("0", 0));
      expect(rewards[0].height).equal(ethers.utils.parseUnits("0", 0));
    });

    it("Should have no rewards without settlement", async function () {
      const { nodeRewardVault } = await loadFixture(deployRewardFixture);

      const [rewardsMetdata] = await nodeRewardVault.rewardsAndHeights(1);
      expect(rewardsMetdata.value).equal(ethers.utils.parseUnits("0", 0));
      expect(rewardsMetdata.height).equal(ethers.utils.parseUnits("0", 0));

      expect(await nodeRewardVault.rewardsAndHeights(0)).to.have.members([]);

      const rewards = await nodeRewardVault.rewardsAndHeights(10);
      expect(rewards.length).equal(1);
      expect(rewards[0].value).equal(ethers.utils.parseUnits("0", 0));
      expect(rewards[0].height).equal(ethers.utils.parseUnits("0", 0));
    });

    it("Should have rewards with settlement", async function () {
      const { nodeRewardVault, owner } = await loadFixture(deployRewardFixture);

      await expect(nodeRewardVault.setPublicSettleLimit(20000)).to.emit(nodeRewardVault, "PublicSettleLimitChanged").withArgs(216000, 20000);

      await network.provider.send("hardhat_mine", ["0x34bc1"]);
      let latestBlock = await ethers.provider.getBlock("latest")
      await expect(nodeRewardVault.publicSettle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock.number+1, ethers.utils.parseEther("90"));
      let rewards = await nodeRewardVault.rewardsAndHeights(10);

      expect(rewards.length).equal(2);
      expect(rewards[0].value).equal(ethers.utils.parseUnits("0", 0));
      expect(rewards[0].height).equal(ethers.utils.parseUnits("0", 0));
      expect(rewards[1].value).equal(ethers.utils.parseEther("90"));
      expect(rewards[1].height).equal(latestBlock.number+1);

      await network.provider.send("hardhat_mine", ["0x34bc1"]);
      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
      });
      latestBlock = await ethers.provider.getBlock("latest")
      await expect(nodeRewardVault.publicSettle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock.number+1, ethers.utils.parseEther("90"));
      rewards = await nodeRewardVault.rewardsAndHeights(10);
      expect(rewards.length).equal(3);
      expect(rewards[0].value).equal(ethers.utils.parseUnits("0", 0));
      expect(rewards[0].height).equal(ethers.utils.parseUnits("0", 0));
      expect(rewards[2].value).equal(ethers.utils.parseEther("180"));
      expect(rewards[2].height).equal(latestBlock.number+1);
    });
  });

  describe("settle and claimRewards", function () {
    it("Should have the right balance", async function () {
      const { nodeRewardVault } = await loadFixture(deployRewardFixture);

      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should have rewards", async function () {
      const { aggregator, nodeRewardVault, owner } = await loadFixture(deployRewardFixture);

      const reward = await nodeRewardVault.rewards(0);
      expect(reward).to.be.equal(ethers.utils.parseEther("0"));

      await nodeRewardVault.setPublicSettleLimit(20000);
      expect(await nodeRewardVault.publicSettleLimit()).to.equal(20000);

      await network.provider.send("hardhat_mine", ["0x34bc1"]);
      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
      });

      const latestBlock = await ethers.provider.getBlock("latest")

      await expect(nodeRewardVault.publicSettle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock.number+1, ethers.utils.parseEther("180"));

      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("200"));
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("20"));

      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
      });

      const data1 =
      "0x011c000000000000000000000000000093d9f1e58ab7cf478d35f1661c59a841eb3a1c627e55b3ecdaf8aa7d2999e8d5c5aae5af3834d8244f2501d16f7a40ad010000000000000000000000bb5b420f1d3967756d4e46f830e1ca142e1e0545a6eb199e52568df716ebb2d4a4a7638c86737b4f39f9a1776f39d6488f8c0b73946e66575cb50e49e58d1867890b48b311ff2784dc18b2a7087cf199ed980c137c8e8f6b4ac4a07b182533a3d462385d14ea8cc560e32e0bc005c0eb71bc634e67ff826e8d32f2967db660f6361036e6d9f129693741ecbf03ebd8084961ebb10000000000000000000000000000000000000000000000000000000006e1752c2a13a5bd053923eb63463474deeef9aff43294971c6d10a262eb0421f71717d9dee9b45d60bb7d8a97113dc6d094cbc0bd03ad2a50fa7aab3d3b40fb80e249e9";
      await aggregator.stake([data1], { value: ethers.utils.parseEther("32") });
    
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("120"));
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("30")); // dao reward
      await nodeRewardVault.claimDao();
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("0"));
      
      await network.provider.send("hardhat_mine", ["0x34bc1"]);
      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
      });

      const latestBlock2 = await ethers.provider.getBlock("latest")
      await expect(nodeRewardVault.publicSettle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock2.number+1, ethers.utils.parseEther("45"));
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("55")); 
      await aggregator.claimRewards(1);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("10"));
      await nodeRewardVault.claimDao();
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("0"));
    
      const data2 =
      "0x011c0000000000000000000000000000b0917fe7ef834819712d3bc5cbb37fb89b49a6149b573bf07f28059b6560d575ff09a44980bf9b0a37febc0a979b2a01001c1e94882d5f461636f3ac314986165027497c9a48a0f1bdaa9147fdd09470a9e48de9f5bf75fbc9847d2ffa51be36a8377cce0509f83a05bcb7b4507668d665d2e25309ed9880f57ba372b87c3e5817fb8ce289e0a22c655762145c0300d00afe9ebf83ccbd54e8110ad5980f67165fd26d290b9aa50f0f7c49619d587196b84839697afc4e347e943d9472abb000f37c0e61679fb31105d46340d0291aab0000000000000000000000000000000000000000000000000000000006e1752c7ac4d1706a72cf62bd12f89eceead45f07a5325010f3c11cbac71d6cca9c9ba7dc46f6f7bdeaa3fcaf011ad4891ad608ac9bbf5c1400d72df0358e81db53d7d7";
      const data3 =
      "0x011b0000000000000000000000000000a9b8c5e5ba5ff379c3216f8e09154b3cf56dee608eabfb24ef7d3dd99d4a6cba34bfde5c493c8e05ee942a3d705ab2c3002fa1256542629e76418786502f8dc5b78703c89e53f3aae3c5ed5708b7ffa8954fb880517ad78212a580fc50cfb761450ae93fe2f44d3b50c7b039d21e59bdef3ec4cb2e300f1bc2eb205d263e129015198918ff8853e7535e188ccb678967fd48a2d7f1206fbdcc6cc529c15cf598554425d84039c7ecb9cb2f2a69943bc6e06833af98caa3051a4eb4f887db982dc7048c3d40a8b9bf64edcf2fd621bfe20000000000000000000000000000000000000000000000000000000006e1752c3e8788a4ff23fda9506b559056f0646d0c5fae1c5479a0a828ea0a03568068303723646e88de0e5ecbb31c9cb8744b0f70eae53f68dfdc5bdfa713dd61336cd2";
      const data4 =
      "0x011c000000000000000000000000000086ce949d229effaf0487577a24a98b336d35da5fe3ead525f02c62cdce162c3d0c8b9fef079e74a23510b719d4e973b0010000000000000000000000bb5b420f1d3967756d4e46f830e1ca142e1e0545ac5eaf2ae6de79a149f94c48e07cb334c112a362c96fb76917ffe55b2130da88c39fcf418b1b06d7d606874d69bcf667013c41f4cf7ed8f06e84c7fbf4f8fcbd0906cdf2875a15e144fa5fb8dbd0c8793254598553aabc21b54c9c4f4580456abf65a725024fa14745d02122d810ec1fe75d9c464e787c09eff16fe998cc09c20000000000000000000000000000000000000000000000000000000006e1752c5b499492c34bd2f1b1f57cd2480bca7f3c88f224f501713b462ce72e198661f90c830f6337cb8db9eb3320ed370c62d70a9f46153b9a0f4f7cf2544ce7c894aa";
   
      await network.provider.send("hardhat_mine", ["0x34bc1"]);
      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
      });
      await aggregator.stake([data2], { value: ethers.utils.parseEther("32") });

      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("100"));
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("55")); 
      await aggregator.claimRewards(1);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("10"));
      await nodeRewardVault.claimDao();
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("0"));

      await network.provider.send("hardhat_mine", ["0x34bc1"]);
      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
      });
      const latestBlock3 = await ethers.provider.getBlock("latest")
      await expect(nodeRewardVault.publicSettle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock3.number+1, ethers.utils.parseEther("30"));
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("70")); 
      await aggregator.claimRewards(1);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("40"));
      await nodeRewardVault.claimDao();
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("30"));
      await aggregator.claimRewards(2);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("0"));

      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("100"), // Sends exactly 100 ether
      });

      await aggregator.stake([data3, data4], { value: ethers.utils.parseEther("64") });
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("70")); 
      await aggregator.claimRewards(1);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("40"));
      await nodeRewardVault.claimDao();
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("30"));
      await aggregator.claimRewards(2);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("0"));

      await network.provider.send("hardhat_mine", ["0x34bc1"]);
      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("110"), // Sends exactly 100 ether
      });

      const latestBlock4 = await ethers.provider.getBlock("latest")
      await expect(nodeRewardVault.publicSettle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock4.number+1, ethers.utils.parseEther("19.8"));
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("90.2")); 
      await aggregator.claimRewards(1);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("70.4"));
      await nodeRewardVault.claimDao();
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("59.4"));
      await aggregator.claimRewards(2);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("39.6"));
      await aggregator.claimRewards(3);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("19.8"));
      await aggregator.claimRewards(4);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("0"));

      await owner.sendTransaction({
        to: nodeRewardVault.address,
        value: ethers.utils.parseEther("110"), // Sends exactly 100 ether
      });
      await expect(nodeRewardVault.publicSettle()).to.not.emit(nodeRewardVault, "Settle");
      await network.provider.send("hardhat_mine", ["0x34bc1"]);

      const latestBlock5 = await ethers.provider.getBlock("latest")
      await expect(nodeRewardVault.publicSettle()).to.emit(nodeRewardVault, "Settle").withArgs(latestBlock5.number+1, ethers.utils.parseEther("19.8"));
      await aggregator.claimRewards(0);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("90.2")); 
      await aggregator.claimRewards(1);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("70.4"));
      await nodeRewardVault.claimDao();
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("59.4"));
      await aggregator.claimRewards(2);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("39.6"));
      await aggregator.claimRewards(3);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("19.8"));
      await aggregator.claimRewards(4);
      expect(await ethers.provider.getBalance(nodeRewardVault.address)).to.equal(ethers.utils.parseEther("0"));
    });
  });
});