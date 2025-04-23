require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    solidity: "0.8.24",
    solidity: {
    version: "0.8.24",
    settings: {
        optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },

    paths: {
        sources: "./contracts", // Contract source folder
        tests: "./tests",       // Test folder
        cache: "./hardhat/cache",  // Cache folder
        artifacts: "./contracts/artifacts", // Artifacts folder
    },

    defaultNetwork: "localhost",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    },

    mocha: {
        timeout: 20000
    }
};
