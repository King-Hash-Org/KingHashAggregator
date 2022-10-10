const { deployNodeRewardVault } = require("./helper.ts");
const nftAddress = "0x4dfc2940482274f287562DeD4083e52E22A1532A"; // nft contract address

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
