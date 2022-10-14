const { deployAggregator } = require("./helper.ts");

const depositContract = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const vaultContract = "0x8F7845df4d9A490202Ecc2b6b4a2a32f1850Cd1a";
const nftAddress = "0x4dfc2940482274f287562DeD4083e52E22A1532A"; // nft contract address
const lidoContractAddress = "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F";
const lidoControllerContractAddress= "0x27dDD94bc480a393cF1C7270618e64B9051A3E7e";
const rocketStorageAddressContractAddress = "0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3";
const rocketPoolControllerContractAddress = "0xcd95DBEC9f99073fa1bf38E5b8fBd2a96AdCe98C";

async function main() {
  await deployAggregator(
    depositContract, 
    vaultContract, 
    nftAddress, 
    lidoContractAddress, 
    lidoControllerContractAddress, 
    rocketStorageAddressContractAddress, 
    rocketPoolControllerContractAddress
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
