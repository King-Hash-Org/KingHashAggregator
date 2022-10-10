const { deployAll } = require("./helper.ts");

const depositContract = "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b";
const lidoContractAddress = "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F";
const rocketStorageAddressContractAddress = "0xd8Cd47263414aFEca62d6e2a3917d6600abDceB3";
const delayTime = 150;
const proposersArray = ['0xf76977649aE4Da7dddFDAc54B41fE1321599435F', '0xF5ade6B61BA60B8B82566Af0dfca982169a470Dc'];
const executorsArray = ['0xf76977649aE4Da7dddFDAc54B41fE1321599435F']    // Executors Array <-- DAO

async function main() {
    await deployAll(
        depositContract,
        lidoContractAddress,
        rocketStorageAddressContractAddress,
        delayTime,
        proposersArray,
        executorsArray
    );
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

export {};