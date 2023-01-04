import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("LiqStaking", function () {

    async function deployKingHashLiqStaking() {
        // Contracts are deployed using the first signer/account by default
        const [owner, daoAcc1, daoAcc2, daoAcc3, daoAcc4, referral1, referral2, wallet1 , wallet2 ] = await ethers.getSigners();

        const KingHashLiquidStakingContract = await ethers.getContractFactory("KingHashLiquidStaking");
        const liquidStaking = await KingHashLiquidStakingContract.deploy();
        const withdrawCred = "0x010000000000000000000000d530d401d03348e2b1364a4d586b75dcb2ed53fc" ;
        


        const NftContract = await ethers.getContractFactory("ValidatorNft");
        const nftContract = await NftContract.deploy();
        await nftContract.initialize();

        const NodeRewardVault = await ethers.getContractFactory("NodeRewardVault");
        const nodeRewardVault = await NodeRewardVault.deploy();
        await nodeRewardVault.initialize(nftContract.address);
  
        const DepositContract = await ethers.getContractFactory("DepositContract");
        const depositContract = await DepositContract.deploy();
  
        const Aggregator = await ethers.getContractFactory("Aggregator");
        const aggregator = await Aggregator.deploy();
        const chainupOperator = "0xd28ED4D0B1f9bd8dDBd6700b20e7E40889d37898" ;


        await liquidStaking.initLiqStakingVault( withdrawCred, aggregator.address , nftContract.address);
        await aggregator.initialize( depositContract.address, nodeRewardVault.address, nftContract.address, liquidStaking.address, chainupOperator );
        await liquidStaking.addOperator(daoAcc1.address, "ChainUp") ;
        await liquidStaking.addOperator(daoAcc2.address, "X-Hash") ;
        await liquidStaking.addOperator(daoAcc3.address, "Bitman") ;

        await nodeRewardVault.setAggregator(aggregator.address);
        await nftContract.setAggregator(aggregator.address);


    
        return { liquidStaking, depositContract, owner, daoAcc1, daoAcc2, daoAcc3, daoAcc4 , referral1, referral2, wallet1 , wallet2 };
      }

      describe("Testing for Liq Staking", function () {

        it("Testing Stake function - if Given Node_Operator is not part of Approved Operator Pool ", async function () {
            const { liquidStaking , daoAcc1, daoAcc2, daoAcc3, daoAcc4 , referral1 , referral2, wallet1 , wallet2} = await deployKingHashLiqStaking();

            // add event emit
            await expect(liquidStaking.connect(wallet1).stake(referral1.address, daoAcc1.address , { value: ethers.utils.parseEther("36") } )).to.emit(liquidStaking, "DepositReceived").withArgs(wallet1.address, ethers.utils.parseEther("36"), referral1.address);
            
            const balance1 =  await ethers.provider.getBalance(liquidStaking.address) ; 
            expect ( await ethers.provider.getBalance(liquidStaking.address)).to.equal(BigInt(36000000000000000000) ) ; 
            console.log("balance1: ", balance1) ; 
            // check operator pool balance
            console.log("balance2: ", await liquidStaking.operatorBalance(daoAcc1.address)) ; 
            // expect (await liquidStaking.operatorEthBalance(daoAcc1.address)).to.equal(BigInt(36000000000000000000  * 9995 / 10000) ) ; 
            // expect (await liquidStaking.operatorEthBalance(daoAcc1.address)).to.equal(   ) ; 
            // check keth balance
            console.log("keth balance of wallet1 : ", await liquidStaking.balanceOf(wallet1.address) );

            await expect(liquidStaking.stake(referral1.address, daoAcc4.address , { value: ethers.utils.parseEther("16") })).to.be.revertedWith("Node operator must be approved");
            await expect(liquidStaking.connect(wallet2).stake(referral2.address, daoAcc2.address , { value: ethers.utils.parseEther("2") } )).to.emit(liquidStaking, "DepositReceived").withArgs(wallet2.address, ethers.utils.parseEther("2"), referral2.address);

            // await liquidStaking.stake(referral2.address, daoAcc2.address , { value: ethers.utils.parseEther("2") } )  ;
            // add event emit
            await liquidStaking.stake(referral1.address, daoAcc3.address , { value: ethers.utils.parseEther("32") } )  ;
            // add event emit
            await liquidStaking.stake(referral2.address, daoAcc3.address , { value: ethers.utils.parseEther("16") } )  ;
            // add event emit
            // do a check on ether balance and operator balance

            await expect(liquidStaking.stake(daoAcc2.address, daoAcc4.address , { value: ethers.utils.parseEther("16") })).to.be.revertedWith("Node operator must be approved");
          });

          
        it("Testing Stake function - if Referral is not given ", async function () {
            const { liquidStaking , daoAcc1, daoAcc2, daoAcc3 , daoAcc4, referral1  } = await deployKingHashLiqStaking();
            const zeroAddress = "0x0000000000000000000000000000000000000000" ;
            await liquidStaking.stake(referral1.address, daoAcc3.address , { value: ethers.utils.parseEther("16") } )  ;
            await expect(liquidStaking.stake(zeroAddress , daoAcc1.address , { value: ethers.utils.parseEther("16") })).to.be.revertedWith("Referral address must be provided");
            await expect(liquidStaking.stake(zeroAddress , daoAcc2.address , { value: ethers.utils.parseEther("32") })).to.be.revertedWith("Referral address must be provided");
            await expect(liquidStaking.stake(zeroAddress , daoAcc3.address , { value: ethers.utils.parseEther("1") })).to.be.revertedWith("Referral address must be provided");

        });

        // test different amount of ether based on ur contract 100 wei and 0 ether

      });

      it("Testing Staking Function -Check if Operator Pool Balance is updated", async function () {
        const { liquidStaking , daoAcc1, daoAcc2, daoAcc3 , daoAcc4, referral1, wallet1, wallet2  } = await deployKingHashLiqStaking();
        await liquidStaking.connect(wallet2).stake(referral1.address, daoAcc1.address , { value: ethers.utils.parseEther("34") } )  ;
        expect(await ethers.provider.getBalance(liquidStaking.address)).to.equal(ethers.utils.parseEther("34"));
        // expect ( await ethers.provider.getBalance(liquidStaking.address)).to.equal(ethers.utils.parseEther("33.983" )) ; 
        // expect ( await ethers.provider.getBalance(liquidStaking.address)).to.equal(ethers.utils.parseEther("33.983" )) ; 

        console.log("await ethers.provider.getBalance(liquidStaking.address): ", await ethers.provider.getBalance(liquidStaking.address)) ; 
        // check operator pool balance
        expect (await liquidStaking.operatorBalance(daoAcc1.address)).to.equal(BigInt(33983000000000000000) ) ; 

        expect (await liquidStaking.operatorBalance(daoAcc1.address)).to.equal(ethers.utils.parseEther("33.983") ) ; 

        expect (await liquidStaking.operatorBalance(daoAcc1.address)).to.equal(BigInt(34000000000000000000  * 9995 / 10000) ) ; 

        //check if user has gotten correct amt of keth
        console.log("keth balance of wallet2: ", await liquidStaking.balanceOf(wallet2.address) );
        expect (await liquidStaking.balanceOf(wallet2.address)).to.equal(BigInt(34000000000000000000  * 9995 / 10000) ) ; 

        // // // check whether the operator mapping has 33 ether
        // // // check whether the balance of the contract is 33 ether
        // // // check everything adds up to 33 ether

        // const pubkey1 = "0xa37050f3319434a41e9c466cd2db0f988e48613a8a5fae7f0d19ad0e3b588beed4e42d43123cf573afdbf30a3f90e00c" ;
        // const signature1 = "0x8d742ae75c0824aab22c9ef78c368c183945d1c50c9335482c8e963715e9b117ef021fe878707e22da18aa68993a4dfd1615d4d05d16c837b25b1e27cc0ca9f58705ea7d0dfe8eb43eaaf21ea6b4810fc725b7368f122563919970d66b854a9b" ;
        // const deposit_data_root1 = "0xb9e2cdf7d8dd1af7980df5acb4446fc8b45924026ef5f6c4289cf5ea42b07acc" ;
        // await liquidStaking.connect(daoAcc1).registerValidator(pubkey1, signature1, deposit_data_root1) ;


        // const balance1 = await daoAcc1.getBalance();
        // console.log("balance1 ", balance1) ;

        // expect(balance1).to.be.greaterThan(ethers.utils.formatEther(0));
        // expect(balance1).to.be.greaterThan(0);

        // await expect (liquidStaking.connect(daoAcc1).registerValidator(pubkey1, signature1, deposit_data_root1)) ;


    });

        
      describe("Testing for Register Validator", function () {
          
        it("Testing RegisterValidator - if Pool has less than 32 ETH ", async function () {

            const { liquidStaking , daoAcc1, daoAcc2, daoAcc3 , daoAcc4, referral1, referral2  } = await deployKingHashLiqStaking();
            await liquidStaking.stake(referral1.address, daoAcc1.address , { value: ethers.utils.parseEther("66") } )  ;
            expect ( await ethers.provider.getBalance(liquidStaking.address)).to.equal(BigInt(66000000000000000000) ) ; 

            // // check whether the operator mapping has 33 ether
            // // check whether the balance of the contract is 33 ether
            // // check everything adds up to 33 ether
            console.log("liquidStaking, ", liquidStaking.address) ;
            const pubkey1 = "0x865d71e31f640fc69dfd5577d07d15debe57feed483d7c6fb4f456f0fcacbb2364221e543941ed497993f754bf661cc6" ;
            const signature1 = "0xb5ac7e8ef6474cc7fd628e057c5d9bb3ae5a5ab301770729a16bbb0dbadffabcdf8b1528200d8d5aa305d7746ca2df8d037a5c4b982252b0d5aa0931185d04f988bcf478dc364e1e26bf2933fdbeb296d512f1af0c66745103ae4da82649c148" ;
            const deposit_data_root1 = "0x48d7d909e5125f507d30c6a20ceb5de604f99d5692a486a00a0a01768eb0a692" ;
            console.log("liquidStaking.operatorEthBalance(daoAcc1.address): ", await liquidStaking.operatorBalance(daoAcc1.address));

            await liquidStaking.connect(daoAcc1).registerValidator(pubkey1, signature1, deposit_data_root1) ;
            await expect(liquidStaking.connect(daoAcc1).registerValidator(pubkey1, signature1, deposit_data_root1)).to.be.revertedWith("Pub key already in used");
            
            await liquidStaking.stake(referral2.address, daoAcc2.address , { value: ethers.utils.parseEther("33") } )  ;
            const pubkey2 = "0x8c1b7fac3873602201a120b0909c7619945f92ef94e5f267700c78d8b457f2c4731604f7f8a7e54fab05dafc4d82c704" ;
            const signature2 = "0xa684e6a877155d70876b45d7baebd3452234d93a5f9e97ce87028afd35948cf7cec481d3fbdce208e34f47148fa308c10ecb6a4f7d0901f1add7b2aa035c6c203c34ae5cf6f32d95d29ef41c9bb681180ec61bc2fa53e5c75eafe846e57502cf" ;
            const deposit_data_root2 = "0xe27e2e52c4e60228fa553250cb4e8a0c650495dabf33914f4e33218341156bdf" ;
            await liquidStaking.connect(daoAcc2).registerValidator(pubkey2, signature2, deposit_data_root2) ;

            const pubkey3 = "0x90f1cbc6d03eeae62880b5b175d873fabc60e1c46d627e6e8f16390cb64128639534bc6bd1bbe1b89e503bb874396c32" ;
            const signature3 = "0xb121c39ded6a852f1e4a146af607dc31cc29101fcb57cf7f6b441d0074bca4f433fbf5b47f74052acc06fcb6efa9c93506f0cd3805290c349bf32aee3c8c13c66fed52b1bad416f4c5399592b131c81ecb9547d449810cef480df72ae7584e75" ;
            const deposit_data_root3 = "0x4c787b11df2eb2a48e3395cb59b40a702ee75b94bb78b3a1f11a5b87226fa5be" ;
            await expect( liquidStaking.connect(daoAcc4).registerValidator(pubkey3, signature3, deposit_data_root3)).to.be.rejectedWith("The message sender is not part of KingHash Operators")  ;
            await expect(liquidStaking.connect(daoAcc3).registerValidator(pubkey3, signature3, deposit_data_root3)).to.be.rejectedWith("The pool has less than 32 Eth")  ;
            await liquidStaking.stake(referral2.address, daoAcc3.address , { value: ethers.utils.parseEther("40") } )  ;
            await liquidStaking.connect(daoAcc3).registerValidator(pubkey3, signature3, deposit_data_root3) ;
            console.log("liquidStaking.operatorEthBalance(daoAcc3.address)", await liquidStaking.operatorBalance(daoAcc3.address) )  ;
            // expect (await liquidStaking.operatorEthBalance(daoAcc1.address)).to.equal(BigInt(40000000000000000000  * 9995 / 10000) ) ; 

            // await liquidStaking.connect(daoAcc3).registerValidator(pubkey3, signature3, deposit_data_root3) ;
            // expect(await liquidStaking.connect(daoAcc2).registerValidator(pubkey1, signature1, deposit_data_root1)).to.be.revertedWith("The pool has less than 32 Eth");
            // expect(await liquidStaking.connect(daoAcc3).registerValidator(pubkey1, signature1, deposit_data_root1)).to.be.revertedWith("The pool has less than 32 Eth");

            // await expect (liquidStaking.connect(daoAcc1).registerValidator(pubkey1, signature1, deposit_data_root1)) ;

            // operator mapping should be left with 1 ether
            // balance of contract  should be 1 ether
            // check everything adds up to 33 ether

        });



      // if same validator/pubkey, should fail or reject for registerValidator

      // check if u can query all pubkey of outstanding validators

      // check if u can query a specific dao's operator's all pubkey of outstanding validators



        });

});