const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BetaContract", function () {
  
    it("Contract deployment", async function () {

        // Get the ContractFactory for the contract
        const BetaContract = await ethers.getContractFactory("BetaContract");

        // Deploy the contract
        const betaContract = await BetaContract.deploy();

        // Wait until the contract is deployed
        await betaContract.deployed();

        // Check if the contract address is valid (not zero)
        expect(betaContract.address).to.properAddress;
    });

    it("getOwner", async function () {

        const [owner, signers] = await ethers.getSigners();

        // Get the ContractFactory for the contract
        const BetaContract = await ethers.getContractFactory("BetaContract");

        // Deploy the contract
        const betaContract = await BetaContract.deploy();

        // Wait until the contract is deployed
        await betaContract.deployed();

        // Check if the contract address is valid (not zero)
        expect(await betaContract.getOwner()).to.equal(owner.address);
    });

});