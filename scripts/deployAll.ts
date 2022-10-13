const { deployAll } = require("./helper.ts");

// ropsten 0x6f22fFbC56eFF051aECF839396DD1eD9aD6BBA9D
// goerli 0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b
const depositContract = "0x6f22fFbC56eFF051aECF839396DD1eD9aD6BBA9D";
const delayTime = 150;
const proposersArray = ['0xf76977649aE4Da7dddFDAc54B41fE1321599435F', '0xF5ade6B61BA60B8B82566Af0dfca982169a470Dc'];
const executorsArray = ['0xf76977649aE4Da7dddFDAc54B41fE1321599435F']    // Executors Array <-- DAO

async function main() {
    await deployAll(
        depositContract,
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