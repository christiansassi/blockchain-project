/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");
//require('chai').use(require('chai-as-promised')).should();

module.exports = {
  solidity: "0.8.19",
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./contracts/cache",
    artifacts: "./contracts/artifacts"
  }
};

