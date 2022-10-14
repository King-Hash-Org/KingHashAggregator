const { deployNodeRewardVault } = require("./helper.ts");
const nftAddress = "0x40Cd77D9aa9e0b2D485259415eA05486B201c514"; // nft contract address

async function main() {
  await deployNodeRewardVault(nftAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
