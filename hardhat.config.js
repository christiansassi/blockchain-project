require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.19",
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./contracts/cache",
    artifacts: "./contracts/artifacts"
  },
  networks: {
    hardhat: {
      accounts: {
        count: 10, // Number of accounts to generate
        accountsBalance: "10000000000000000000000" // Balance for each account in wei (10,000 ETH)
      }
    }
  }
};