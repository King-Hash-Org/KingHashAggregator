const { deployTimelock } = require("./helper.ts");
const delayTime = 150;
const proposersArray = ['0xf76977649aE4Da7dddFDAc54B41fE1321599435F', '0xF5ade6B61BA60B8B82566Af0dfca982169a470Dc'];
const executorsArray = ['0xf76977649aE4Da7dddFDAc54B41fE1321599435F']    // Executors Array <-- DAO

async function main() {
  await deployTimelock(delayTime, proposersArray, executorsArray);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};