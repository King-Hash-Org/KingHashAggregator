const { deployAggregator } = require("./helper.ts");

const depositContract = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const vaultContract = "0xade4A1e54a0efA7c0557e8fdecC714F716eD0Be6";
const nftAddress = "0x40Cd77D9aa9e0b2D485259415eA05486B201c514"; // nft contract address

async function main() {
  await deployAggregator(
    depositContract, 
    vaultContract, 
    nftAddress,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
