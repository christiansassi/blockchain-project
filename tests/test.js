const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "BetaContract";
const ETH = ethers.utils.parseEther("1.0"); // 1 ETH in wei
const WARRANTY_TIME = 2158348096000; // 30 days

async function getContract() {

    // Get the ContractFactory for the contract
    const Contract = await ethers.getContractFactory(CONTRACT_NAME);

    // Deploy the contract
    const contract = await Contract.deploy();

    // Wait until the contract is deployed
    await contract.deployed();

    return contract;

}

describe("BetaContract basic functions", function () {

    it("Contract deployment", async function () {

        // Deploy the contract
        const contract = await getContract();

        // Check if the contract address is valid (not zero)
        expect(contract.address, "Invalid contract address").to.properAddress;

    });

    it("getOwner", async function () {

        // Deploy the contract
        const contract = await getContract();
        
         // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Verify if the owner has been set successfully
        expect(await contract.getOwner()).to.equal(accounts[0].address, "Owner address doesn't match via getOwner()");

    });

    it("setOwner", async function () {

        // Deploy the contract
        const contract = await getContract();
        
        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Set new owner
        await contract.setOwner(accounts[1].address);

        // Verify if the owner has been changed successfully
        expect(await contract.getOwner()).to.equal(accounts[1].address, "Unable to set new owner via setOwner()");

    });

});

describe("BetaContract advanced functions", function () {

    it("sell", async function () {

        // Deploy the contract
        const contract = await getContract();
        
        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const warrantyTime = WARRANTY_TIME;
        const orderId = await sellerContract.sell(buyer.address, price, warrantyTime);

        expect(orderId).to.not.equal(0);
    });

    it("buy", async function () {

        // Deploy the contract
        const contract = await getContract();
        
        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const warrantyTime = WARRANTY_TIME;

        const orderId = await sellerContract.sell(buyer.address, price, warrantyTime);

        expect(orderId).to.not.equal(0);

        await buyerContract.buy(seller.address, price, orderId, warrantyTime, {
            value: price
        });
    });

});