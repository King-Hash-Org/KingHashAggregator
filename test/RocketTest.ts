import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Address, zeroAddress } from "ethereumjs-util";
import { AddressZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("RocketTest", function () {
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

      describe("Testing for Rocket Controller", function () {
    
        it("Correct data behaviour for RocketPool Controller", async function () {
        const {  rocketController, owner, otherAccount , anotherAccount } = await deployBaseFixture();
        await rocketController.addAllowList(owner.address); 

             //Test Add/Get RETH Balance
        await rocketController.addREthBalance(otherAccount.address , ethers.utils.parseEther("5") )    
        const rEthBalance = await rocketController.getREthBalance(otherAccount.address );  
        await expect(ethers.utils.formatUnits(rEthBalance, 18)).to.equal("5.0");
        
        });
    
        it("AllowList Behavior", async function () {
          const {rocketController, owner  } = await deployBaseFixture();
          await rocketController.addAllowList(owner.address ) ;
          await rocketController.removeAllowList(owner.address ) ;
          await  expect(rocketController.addREthBalance( owner.address , ethers.utils.parseEther("2") ) ).to.be.rejectedWith("Not allowed to add RETH Balance");
    
        });

        it("Zero address behaviour", async function () {
        const { rocketController, owner , otherAccount } = await deployBaseFixture();
        //Zero address behaviour
        await rocketController.addAllowList(owner.address);
        await expect(rocketController.addREthBalance("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("3"))).to.be.rejectedWith("User should not be zero address"); 
        });

        it("UUPSUpgradeable Behavior", async function () {
          const {  otherAccount, rocketController  } = await deployBaseFixture();
          // await expect(rocketController.upgradeTo(otherAccount.address)).to.emit(rocketController, "Upgraded").withArgs( otherAccount.address) ;
          });

        it("OwnableUpgradeable Behavior", async function () {
          const { owner, otherAccount, aggregator, rocketController, anotherAccount  } = await deployBaseFixture();
          await expect(rocketController.transferOwnership(otherAccount.address)).to.emit(rocketController, "OwnershipTransferred").withArgs(  owner.address , otherAccount.address) ;
          expect( await rocketController.owner()).to.be.equal(otherAccount.address);
        });
        
      });

});
