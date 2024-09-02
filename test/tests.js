const {time, loadFixture,} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BigNumber } = import("ethers");

const ETH = ethers.parseEther("1.0"); // 1 ETH in wei

const CONTRACT_NAME = "BetaContract";
const ORDER_ID_EVENT = "OrderIdEvent";
const ORDER_STATE_EVENT = "OrderStateEvent";

const DAYS_1 = 24 * 60 * 60;
const MINUTES_1 = 60;
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

async function deployContractFixture() {
        
    // Get the ContractFactory for the contract
    const Contract = await ethers.getContractFactory(CONTRACT_NAME);

    // Deploy the contract
    const contract = await Contract.deploy();

    // Wait until the contract is deployed
    await contract.waitForDeployment();

    return { contract };
}

describe("BetaContract deployment", function () {

    it("Should return a valid contract address", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Check if the contract address is valid (not zero)
        expect(await contract.getAddress(), "Invalid contract address").to.properAddress;

    });

    it("Should return the correct owner address", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Verify if the owner has been set successfully
        expect(await contract.getOwner()).to.equal(accounts[0].address, "Owner address doesn't match");

    });

    it("Should set a new owner", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Set new owner
        await contract.setOwner(accounts[1].address);

        // Verify if the owner has been changed successfully
        expect(await contract.getOwner()).to.equal(accounts[1].address, "Unable to set new owner via setOwner()");

    });

    it("Only the owner can set a new owner", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();

        // Modify msg.sender so that it is not the current owner.
        const notOwnerContract = contract.connect(accounts[1]);

        // A non-owner attempts to set themselves as the new owner. This action should fail
        await expect(notOwnerContract.setOwner(accounts[1].address)).to.be.revertedWith("Only the owner can set a new owner");
    });

});

describe("BetaContract sell", function () {

    it("Should sell a valid product", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // The id of the order should be 1 for the first order
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);
    });

    it("Buyer cannot be the seller", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set seller
        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        await expect(sellerContract.sell(seller.address, price, expiryDate)).to.be.revertedWith("Buyer cannot be the seller");
    });

    it("Price must be greater than zero", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = 0;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.be.revertedWith("Price must be greater than zero");
    });

    it("Expiry date must be in the future", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = 1;

        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.be.revertedWith("Expiry date must be in the future");
    });

});

describe("BetaContract buy", function () {

    it("Should buy a valid product", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
    });

    it("Seller cannot be the buyer", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;
        const orderId = 1;

        await expect(buyerContract.buy(buyer.address, price, orderId, expiryDate, { value: price })).to.be.revertedWith("Seller cannot be the buyer");
    });

    it("Price must be greater than zero", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        
        // Create the order
        let price;
        const expiryDate = getCurrentTimestamp() + DAYS_1;
        const orderId = 1;

        price = 0;
        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: ETH })).to.be.revertedWith("Price must be greater than zero");

        price = -1;
        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: ETH })).to.be.rejected;
    });

    it("Incorrect payment amount sent", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        
        // Create the order
        const price = 1;
        const expiryDate = getCurrentTimestamp() + DAYS_1;
        const orderId = 1;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: ETH })).to.be.revertedWith("Incorrect payment amount sent");
    });

    it("You are not the buyer for this order", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Check the value
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        // Use an account different from the one of the seller
        await expect(buyerContract.buy(accounts[2].address, price, orderId, expiryDate, { value: ETH })).to.be.revertedWith("You are not the buyer for this order");

        // Use a wrong orderId
        await expect(buyerContract.buy(seller.address, price, 100, expiryDate, { value: ETH })).to.be.revertedWith("You are not the buyer for this order");
    });

    it("Order already completed", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;

        // Go forward
        await network.provider.send("evm_increaseTime", [DAYS_1 * 2]); // Increase time by 2 days
        await network.provider.send("evm_mine"); // Mine a new block to apply the time increase

        // Collect the order
        await expect(sellerContract.collectOrder(orderId)).not.to.be.reverted;

        // Try to buy again
        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).to.be.revertedWith("Order already completed");
    });

    it("Order price does not match", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        let price;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        price = ETH;
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        // Use a wrong price
        price = 1;
        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).to.be.revertedWith("Order price does not match");
    });

    it("Order expiry date does not match", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        let expiryDate;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        expiryDate = getCurrentTimestamp() + DAYS_1;
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        // Use a wrong expiry date
        expiryDate = 1;
        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).to.be.revertedWith("Order expiry date does not match");

    });

});

describe("BetaContract get order state", function () {

    it("Order not completed", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // buyer asking for the state of the order (should be false -> not completed)
        await expect(buyerContract["getOrderState(address,uint256)"](seller.address, orderId)).to.emit(contract, ORDER_STATE_EVENT).withArgs(false);
        
        // Seller asking for the state of the order (should be false -> not completed)
        await expect(sellerContract["getOrderState(uint256)"](orderId)).to.emit(contract, ORDER_STATE_EVENT).withArgs(false);
    });

    it("Order completed", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Go forward
        await network.provider.send("evm_increaseTime", [DAYS_1 * 2]); // Increase time by 2 days
        await network.provider.send("evm_mine"); // Mine a new block to apply the time increase

        // Collect the order
        await expect(sellerContract.collectOrder(orderId)).not.to.be.reverted;

        // buyer asking for the state of the order (should be true -> completed)
        await expect(buyerContract["getOrderState(address,uint256)"](seller.address, orderId)).to.emit(contract, ORDER_STATE_EVENT).withArgs(true);
        
        // Seller asking for the state of the order (should be true -> completed)
        await expect(sellerContract["getOrderState(uint256)"](orderId)).to.emit(contract, ORDER_STATE_EVENT).withArgs(true);
    });

    it("Order does not exist", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + MINUTES_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;

        // Use a wrong order id
        await expect(sellerContract["getOrderState(uint256)"](0)).to.be.revertedWith("Order does not exist");
    });

    it("You are not the buyer for this order", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + MINUTES_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;

        // Get the state of the order from a random address
        const randomContract = contract.connect(accounts[2]);

        await expect(randomContract["getOrderState(address,uint256)"](seller.address, orderId)).to.be.revertedWith("You are not the buyer for this order");
    });

});

describe("BetaContract request refund", function () {

    it("Should request a refund", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;
    });

    it("You are not the buyer for this order", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund from a random address
        const randomContract = contract.connect(accounts[2]);

        await expect(randomContract.requestRefund(seller.address, orderId)).to.be.revertedWith("You are not the buyer for this order");
    });

    it("Order already completed", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Go forward
        await network.provider.send("evm_increaseTime", [DAYS_1 * 2]); // Increase time by 2 days
        await network.provider.send("evm_mine"); // Mine a new block to apply the time increase

        // Collect the order
        await expect(sellerContract.collectOrder(orderId)).not.to.be.reverted;

        // Try to request a refund even if the order is completed
        await expect(buyerContract.requestRefund(seller.address, orderId)).to.be.revertedWith("Order already completed");
    });

    it("A refund has been requested. Wait untill it will be accepted or declined", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Try to request another refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).to.be.revertedWith("A refund has been requested. Wait untill it will be accepted or declined");
    });

    it("A refund has been requested and accepted", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change refund state (accepted)
        const ownerContract = buyerContract;
        await expect(ownerContract.updateRefundState(seller.address, orderId, 2)).not.to.be.reverted;

        // Try to request another refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).to.be.revertedWith("A refund has been requested and accepted");
    });

    it("A refund has been requested and declined", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change refund state (declined)
        const ownerContract = buyerContract;
        await expect(ownerContract.updateRefundState(seller.address, orderId, 3)).not.to.be.reverted;

        // Try to request another refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).to.be.revertedWith("A refund has been requested and declined");
    });

    it("Order expired. You cannot collect your order anymore", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order 
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Go forward
        await network.provider.send("evm_increaseTime", [DAYS_1 * 2]); // Increase time by 2 days
        await network.provider.send("evm_mine"); // Mine a new block to apply the time increase

        // Request a refund even if the order is expired
        await expect(buyerContract.requestRefund(seller.address, orderId)).to.be.revertedWith("Order expired. You cannot collect your order anymore");
    });
    

});

describe("BetaContract update refund state", function () {

    it("Should update a refund state", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        let orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order [1]
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        let orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change refund state (accepted)
        const ownerContract = buyerContract;
        await expect(ownerContract.updateRefundState(seller.address, orderId, 2)).not.to.be.reverted;

        // Create listener for ORDER_ID_EVENT
        orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order [2]
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(2);

        orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change refund state (declined)
        await expect(ownerContract.updateRefundState(seller.address, orderId, 3)).not.to.be.reverted;
    });

    it("Only the owner can update the state of a refund request", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Try to change a refund state with a random account
        const randomContract = contract.connect(accounts[2]);

        await expect(randomContract.updateRefundState(accounts[1].address, 1, 2)).to.be.revertedWith("Only the owner can update the state of a refund request");
    });

    it("Order does not exist", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;
        
        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change refund state with wrong seller and order id
        const ownerContract = buyerContract;

        await expect(ownerContract.updateRefundState(accounts[2].address, orderId, 2)).to.be.revertedWith("Order does not exist");
        await expect(ownerContract.updateRefundState(seller.address, 0, 2)).to.be.revertedWith("Order does not exist");
    });

    it("Order already completed", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;

        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change refund state (declined)
        const ownerContract = buyerContract;
        await expect(ownerContract.updateRefundState(seller.address, orderId, 3)).not.to.be.reverted;

        // Go forward
        await network.provider.send("evm_increaseTime", [DAYS_1 * 2]); // Increase time by 2 days
        await network.provider.send("evm_mine"); // Mine a new block to apply the time increase

        // Collect the order
        await expect(sellerContract.collectOrder(orderId)).not.to.be.reverted;
        
        // Try to re-change the refund state
        await expect(ownerContract.updateRefundState(seller.address, orderId, 2)).to.be.revertedWith("Order already completed");
    });

    it("No refund has been requested for this order", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;

        // Try to change a refund state
        const ownerContract = buyerContract;
        await expect(ownerContract.updateRefundState(seller.address, orderId, 2)).to.be.revertedWith("No refund has been requested for this order");
    });

    it("A refund has already been requested and accepted", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;

        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change the refund state (accepted)
        const ownerContract = buyerContract;
        await expect(ownerContract.updateRefundState(seller.address, orderId, 2)).not.to.be.reverted;

        // Try to re-change the refund state (declined)
        await expect(ownerContract.updateRefundState(seller.address, orderId, 3)).to.be.revertedWith("A refund has already been requested and accepted");
    });

    it("A refund has already been requested and declined", async function () {

        // Using the fixture to get a clean deployment
        const { contract } = await loadFixture(deployContractFixture);

        // Get accounts, the first one is the owner of the contract
        const accounts = await ethers.getSigners();
    
        // Set buyer and seller
        const buyer = accounts[0];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        const sellerContract = contract.connect(seller);
        
        // Create the order
        const price = ETH;
        const expiryDate = getCurrentTimestamp() + DAYS_1;

        // Create listener for ORDER_ID_EVENT
        const orderIdPromise = new Promise((resolve) => {
            sellerContract.once(ORDER_ID_EVENT, (orderId) => {
                resolve(Number(orderId.toString()));
            });
        });

        // Create the order
        await expect(sellerContract.sell(buyer.address, price, expiryDate)).to.emit(contract, ORDER_ID_EVENT).withArgs(1);

        const orderId = await orderIdPromise;

        await expect(buyerContract.buy(seller.address, price, orderId, expiryDate, { value: price })).not.to.be.reverted;

        // Request a refund
        await expect(buyerContract.requestRefund(seller.address, orderId)).not.to.be.reverted;

        // Change the refund state (declined)
        const ownerContract = buyerContract;
        await expect(ownerContract.updateRefundState(seller.address, orderId, 3)).not.to.be.reverted;

        // Try to re-change the refund state (accepted)
        await expect(ownerContract.updateRefundState(seller.address, orderId, 2)).to.be.revertedWith("A refund has already been requested and declined");
    });
});