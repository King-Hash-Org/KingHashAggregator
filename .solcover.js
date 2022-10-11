module.exports = {
  skipFiles: ["mocks/", "nfts/ERC721A.sol", "nfts/ERC721AQueryable.sol", "TimelockController.sol"],
  istanbulReporter: ["html", "lcov", "text", "json", "json-summary"],
};
