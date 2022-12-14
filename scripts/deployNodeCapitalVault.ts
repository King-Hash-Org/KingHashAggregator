const { deployNodeCapitalVault } = require("./helper.ts");

async function main() {
  await deployNodeCapitalVault();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {};
