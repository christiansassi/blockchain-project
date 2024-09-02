const {time, loadFixture,} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BigNumber } = import("ethers");

const CONTRACT_NAME = "BetaContract";
const ORDER_ID_EVENT = "OrderIdEvent";
const ETH = ethers.parseEther("1.0"); // 1 ETH in wei
const WARRANTY_TIME = 2158348096000; // 30 days

describe("BetaContract deployment", function () {

    var contract;

    beforeEach(async function () {

        // Get the ContractFactory for the contract
        const Contract = await ethers.getContractFactory(CONTRACT_NAME);

        // Deploy the contract
        contract = await Contract.deploy();

        // Wait until the contract is deployed
        await contract.waitForDeployment();

    });

    it("Should return a valid contract address", async function () {

        // Check if the contract address is valid (not zero)
        expect(await contract.getAddress(), "Invalid contract address").to.properAddress;

    });

    it("Should return the correct owner address", async function () {

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Verify if the owner has been set successfully
        expect(await contract.getOwner()).to.equal(accounts[0].address, "Owner address doesn't match");

    });

    it("Should set a new owner", async function () {

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Set new owner
        await contract.setOwner(accounts[1].address);

        // Verify if the owner has been changed successfully
        expect(await contract.getOwner()).to.equal(accounts[1].address, "Unable to set new owner via setOwner()");

    });

    it("Should fail to set a new owner", async function () {

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Modify msg.sender so that it is not the current owner.
        const notOwnerContract = contract.connect(accounts[1]);

        // A non-owner attempts to set themselves as the new owner. This action should fail
        await expect(notOwnerContract.setOwner(accounts[1].address)).to.be.revertedWith("Only the owner can set a new owner");
    });

});

describe("BetaContract buy/sell", function () {

    var contract;

    beforeEach(async function () {

        // Get the ContractFactory for the contract
        const Contract = await ethers.getContractFactory(CONTRACT_NAME);

        // Deploy the contract
        contract = await Contract.deploy();

        // Wait until the contract is deployed
        await contract.waitForDeployment();

    });

    it("Should buy a valid product", async function () {

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const warrantyTime = WARRANTY_TIME;

        // Check the value
        await expect(sellerContract.sell(buyer.address, price, warrantyTime)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);
    });

    it("Should sell a valid product", async function () {

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

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Check the value
        await expect(sellerContract.sell(buyer.address, price, warrantyTime)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, WARRANTY_TIME, { value: price })).not.to.be.reverted;
    });

});