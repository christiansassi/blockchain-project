const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const ETH = ethers.parseEther("1.0");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const CONTRACT_NAME = "Janus";

const FEE = 1;
const MAX_SELL_DELAY = 24 * 60 * 60;
const WARRANTY = 30 * 24 * 60 * 60;

const ORDER_PAID = "OrderPaid";
const ORDER_ACCEPTED = "OrderAccepted";
const ORDER_WITHDRAWN = "OrderWithdrawn";

const REFUND_REQUESTED = "RefundRequested";
const REFUND_REVOKED = "RefundRevoked";
const REFUND_RESOLVED = "RefundResolved";
const REFUND_WITHDRAWN = "RefundWithdrawn";

const PAUSED = "Paused";
const UNPAUSED = "Unpaused";

const DAYS_1 = 24 * 60 * 60;
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

async function deployContractFixture() {
    // Get the ContractFactory
    const Contract = await ethers.getContractFactory(CONTRACT_NAME);

    // Deploy the contract
    const contract = await Contract.deploy();

    // Wait for deployment to complete
    await contract.waitForDeployment();

    return { contract };
}

describe("Deployment", function () {
    it("Should return a valid contract address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Verify the contract address is valid (not zero address)
        expect(await contract.getAddress(), "Invalid contract address").to.properAddress;
    });
});

describe("Ownership", function () {
    it("Should return the current owner's address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];

        // getOwner() should match accounts[0]
        expect(await contract.getOwner()).to.equal(owner);
    });

    it("Should allow the owner to transfer contract ownership to a new address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const newOwner = accounts[1];

        // Update owner
        await expect(ownerContract.updateOwner(newOwner)).to.not.be.reverted;

        // getOwner() should match accounts[1]
        expect(await contract.getOwner()).to.equal(newOwner);
    });

    it("Should not allow the owner to transfer contract ownership to the zero address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const newOwner = ZERO_ADDRESS;

        // Update owner (should fail)
        await expect(ownerContract.updateOwner(newOwner)).to.be.revertedWithCustomError(ownerContract, "OwnableInvalidOwner").withArgs(newOwner);
    });

    it("Should not allow a normal user to transfer contract ownership to a new address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const user = accounts[1];
        const userContract = contract.connect(user);

        // Update owner (should fail)
        await expect(userContract.updateOwner(user)).to.be.revertedWithCustomError(userContract, "OwnableUnauthorizedAccount").withArgs(user.address);
    });

    it("Should not allow the owner to renuncing ownership", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        // Renounce ownership (should fail)
        await expect(ownerContract.renounceOwnership()).to.be.revertedWith("Renouncing ownership is disabled");
    });
});

describe("Constants", function () { 
    it("Should retrun the fixed service fee", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get fee
        expect(await contract.getFee()).to.equal(FEE);
    });

    it("Should retrun the maximum delay allowed for selling", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get max sell delay
        expect(await contract.getMaxSellDelay()).to.equal(MAX_SELL_DELAY);
    });

    it("Should retrun the warranty duration", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get warranty
        expect(await contract.getWarranty()).to.equal(WARRANTY);
    });
});

describe("Pause / Unpause", function () {
    it("Should allow the owner to pause the contract", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        // Pause
        expect(await ownerContract.pause()).to.emit(ownerContract, PAUSED).withArgs(owner);
    });

    it("Should allow the owner to unpause the contract", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        // Pause
        expect(await ownerContract.pause()).to.emit(ownerContract, PAUSED).withArgs(owner);

        // Unpause
        expect(await ownerContract.unpause()).to.emit(ownerContract, UNPAUSED).withArgs(owner);
    });

    it("Should not allow the owner to pause the contract already paused", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        // Pause
        expect(await ownerContract.pause()).to.emit(ownerContract, PAUSED).withArgs(owner);

        // Pause
        await expect(ownerContract.pause()).to.be.revertedWith("Pausable: paused");
    });

    it("Should not allow the owner to unpause the contract not paused", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        // Pause
        await expect(ownerContract.unpause()).to.be.revertedWith("Pausable: not paused");
    });

    it("Should not allow a user to pause the contract", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const user = accounts[1];
        const userContract = contract.connect(user);

        // Pause
        await expect(userContract.pause()).to.be.revertedWithCustomError(userContract, "OwnableUnauthorizedAccount").withArgs(user.address);
    });

    it("Should not allow a user to unpause the contract", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);

        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const user = accounts[1];
        const userContract = contract.connect(user);

        // Pause
        expect(await ownerContract.pause()).to.emit(ownerContract, PAUSED).withArgs(owner);

        // Unpause
        await expect(userContract.unpause()).to.be.revertedWithCustomError(userContract, "OwnableUnauthorizedAccount").withArgs(user.address);
    });
});

describe("Buy", function () { 
    it("Should allow a user to buy something", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        
        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to buy with an incorrect payment amount", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        
        // Buy (should fail)
        await expect(buyerContract.buy(seller, ETH, {"value": ETH + ETH})).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should not allow a user to buy from an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = ZERO_ADDRESS;
        
        // Buy (should fail)
        await expect(buyerContract.buy(seller, ETH, {"value": ETH})).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow a user to buy from themselves", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[1];
        
        // Buy (should fail)
        await expect(buyerContract.buy(seller, ETH, {"value": ETH})).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow a user to buy with a non-positive price", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        
        // Buy (should fail)
        await expect(buyerContract.buy(seller, 0, {"value": 0})).to.be.revertedWith("Price must be positive");
    });
});

describe("Sell", function () { 
    it("Should allow a user to sell something", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to sell from an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(ZERO_ADDRESS, 1, ETH)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow a user to sell from themselves", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(seller, 1, ETH)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow a user to sell with an invald order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(buyer, 2, ETH)).to.be.revertedWith("Invalid order ID");
    });

    it("Should not allow a user to sell an order that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(buyer, 0, ETH)).to.be.revertedWith("Order does not exist");
    });

    it("Should not allow a user to sell the same order more than once", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(buyer, 1, ETH)).to.be.revertedWith("Order already accepted");
    });

    it("Should not allow a user to sell an order with a pending refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(buyer, 1, ETH)).to.be.revertedWith("A refund has been requested for this order");
    });

    it("Should not allow a user to sell an order with an accepted refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Accept refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(buyer, 1, ETH)).to.be.revertedWith("A refund has been accepted for this order");
    });

    it("Should not allow a user to sell an order with a declined refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Accept refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 6)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(buyer, 1, ETH)).to.be.revertedWith("A refund has been declined for this order");
    });

    it("Should not allow a user to sell an order with a wrong price", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        await expect(sellerContract.sell(buyer, 1, ETH + ETH)).to.be.revertedWith("Price mismatch");
    });

    it("Should not allow a user to sell an order after the max allowed sell delay", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [MAX_SELL_DELAY]);
        await network.provider.send("evm_mine");

        // Sell
        await expect(sellerContract.sell(buyer, 1, ETH)).to.be.revertedWith("Order took too long to be accepted");
    });
});

describe("Withdraw Order", function () { 
    it("Should allow a user to withdraw an order", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Withdraw order
        expect(await sellerContract.withdrawOrder(buyer, 1)).to.emit(sellerContract, ORDER_WITHDRAWN).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to withdraw an order with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Withdraw order
        await expect(sellerContract.withdrawOrder(ZERO_ADDRESS, 1)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow a user to withdraw an order from themselves", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Withdraw order
        await expect(sellerContract.withdrawOrder(seller, 1)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow a user to withdraw an order with an invalid order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Withdraw order
        await expect(sellerContract.withdrawOrder(buyer, 2)).to.be.revertedWith("Invalid order ID");
    });

    it("Should not allow a user to withdraw an order that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Withdraw order
        await expect(sellerContract.withdrawOrder(buyer, 0)).to.be.revertedWith("Order does not exist");
    });

    it("Should not allow a user to withdraw an order before the warranty period ends", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);
        
        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [Math.floor(WARRANTY / 2)]);
        await network.provider.send("evm_mine");

        // Withdraw order
        await expect(sellerContract.withdrawOrder(buyer, 1)).to.be.revertedWith("You cannot withdrawn your funds yet");
    });

    it("Should not allow a user to withdraw an order that has not been accepted", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);
        
        // Withdraw order
        await expect(sellerContract.withdrawOrder(buyer, 1)).to.be.revertedWith("Order has to be accepted first");
    });

    it("Should not allow a user to withdraw an order with a pending refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);
        
        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);
        
        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Withdraw order
        await expect(sellerContract.withdrawOrder(buyer, 1)).to.be.revertedWith("A refund has been requested for this order");
    });

    it("Should not allow a user to withdraw an order with an accepted refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);
        
        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);
        
        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Withdraw order
        await expect(sellerContract.withdrawOrder(buyer, 1)).to.be.revertedWith("A refund has been accepted for this order");
    });
});

describe("Refund", function () { 
    it("Should allow a user to request a refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to request a refund with an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        await expect(buyerContract.requestRefund(ZERO_ADDRESS, 1)).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow a user to request a refund from themselves", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        await expect(buyerContract.requestRefund(buyer, 1)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow a user to request a refund with an invalid order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        await expect(buyerContract.requestRefund(seller, 2)).to.be.revertedWith("Invalid order ID");
    });

    it("Should not allow a user to request a refund for an order that has not been accepted", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Request refund
        await expect(buyerContract.requestRefund(seller, 1)).to.be.revertedWith("Order has to be accepted first");
    });

    it("Should allow a user to request and obtain a refund for an order after the max allowed sell delay", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [MAX_SELL_DELAY]);
        await network.provider.send("evm_mine");

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_WITHDRAWN).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to request a refund for an order with a pending refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Request refund
        await expect(buyerContract.requestRefund(seller, 1)).to.be.revertedWith("A refund has already been requested for this order");
    });

    it("Should not allow a user to request a refund for an order with an accepted refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Request refund
        await expect(buyerContract.requestRefund(seller, 1)).to.be.revertedWith("A refund has already been accepted for this order");
    });

    it("Should not allow a user to request a refund for an order with a declined refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 6)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Request refund
        await expect(buyerContract.requestRefund(seller, 1)).to.be.revertedWith("A refund has already been declined for this order");
    });

    it("Should not allow a user to request a refund after the warranty period", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Forward time
        await network.provider.send("evm_increaseTime", [WARRANTY]);
        await network.provider.send("evm_mine");

        // Request refund
        await expect(buyerContract.requestRefund(seller, 1)).to.be.revertedWith("Refund window closed");
    });

    it("Should allow a user to revoke a refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Revoke refund
        await expect(buyerContract.revokeRefund(seller, 1)).to.emit(buyerContract, REFUND_REVOKED).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to revoke a refund that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Revoke refund
        await expect(buyerContract.revokeRefund(seller, 1)).to.be.revertedWith("No refund has been requested for this order");
    });

    it("Should not allow a user to revoke a refund that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Revoke refund
        await expect(buyerContract.revokeRefund(seller, 1)).to.be.revertedWith("No refund has been requested for this order");
    });

    it("Should not allow a user to revoke a refund that has already been accepted", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Revoke refund
        await expect(buyerContract.revokeRefund(seller, 1)).to.be.revertedWith("A refund has already been accepted for this order");
    });

    it("Should not allow a user to revoke a refund that has already been declined", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 6)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Revoke refund
        await expect(buyerContract.revokeRefund(seller, 1)).to.be.revertedWith("A refund has already been declined for this order");
    });

    it("Should allow the owner to resolve a refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 6)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);
    });

    it("Should allow the owner to resolve a refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to resolve a refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        const user = accounts[3];
        const userContract = contract.connect(user);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(userContract.resolveRefund(buyer, seller, 1, 5)).to.be.revertedWithCustomError(userContract, "OwnableUnauthorizedAccount").withArgs(user.address);
        await expect(userContract.resolveRefund(buyer, seller, 1, 5)).to.be.revertedWithCustomError(userContract, "OwnableUnauthorizedAccount").withArgs(user.address);
    });

    it("Should not allow the owner to resolve a refund with an invalid new refund status", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 0)).to.be.revertedWith("Invalid new refund status");
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 1)).to.be.revertedWith("Invalid new refund status");
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 2)).to.be.revertedWith("Invalid new refund status");
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 3)).to.be.revertedWith("Invalid new refund status");
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 4)).to.be.revertedWith("Invalid new refund status");
    });

    it("Should not allow the owner to resolve a refund with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(ZERO_ADDRESS, seller, 1, 5)).to.be.revertedWith("Invalid buyer address");
        await expect(ownerContract.resolveRefund(ZERO_ADDRESS, seller, 1, 6)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow the owner to resolve a refund with an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, ZERO_ADDRESS, 1, 5)).to.be.revertedWith("Invalid seller address");
        await expect(ownerContract.resolveRefund(buyer, ZERO_ADDRESS, 1, 6)).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow the owner to resolve a refund with the same buyer and seller addresses", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, buyer, 1, 5)).to.be.revertedWith("Buyer and seller match");
        await expect(ownerContract.resolveRefund(buyer, buyer, 1, 6)).to.be.revertedWith("Buyer and seller match");
        await expect(ownerContract.resolveRefund(seller, seller, 1, 5)).to.be.revertedWith("Buyer and seller match");
        await expect(ownerContract.resolveRefund(seller, seller, 1, 6)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow the owner to resolve a refund with an invalid order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, seller, 2, 5)).to.be.revertedWith("Invalid order ID");
        await expect(ownerContract.resolveRefund(buyer, seller, 2, 6)).to.be.revertedWith("Invalid order ID");
    });

    it("Should not allow the owner to resolve a refund for an order that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, seller, 0, 5)).to.be.revertedWith("Order does not exist");
        await expect(ownerContract.resolveRefund(buyer, seller, 0, 6)).to.be.revertedWith("Order does not exist");
    });

    it("Should not allow the owner to resolve a refund that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 5)).to.be.revertedWith("No refund has been requested for this order");
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 6)).to.be.revertedWith("No refund has been requested for this order");
    });

    it("Should not allow the owner to resolve a refund that has already been accepted", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 5)).to.be.revertedWith("A refund has already been accepted for this order");
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 6)).to.be.revertedWith("A refund has already been accepted for this order");
    });

    it("Should not allow the owner to resolve a refund that has already been declined", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 6)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Resolve refund
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 5)).to.be.revertedWith("A refund has already been declined for this order");
        await expect(ownerContract.resolveRefund(buyer, seller, 1, 6)).to.be.revertedWith("A refund has already been declined for this order");
    });

    it("Should allow a user to withdraw a refund", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Withdraw refund
        expect(await buyerContract.withdrawRefund(seller, 1)).to.emit(buyerContract, REFUND_WITHDRAWN).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to withdraw a refund with an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Withdraw refund
        await expect(buyerContract.withdrawRefund(ZERO_ADDRESS, 1)).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow a user to withdraw a refund with the same buyer and seller addresses", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Withdraw refund
        await expect(buyerContract.withdrawRefund(buyer, 1)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow a user to withdraw a refund with an invalid order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Withdraw refund
        await expect(buyerContract.withdrawRefund(seller, 2)).to.be.revertedWith("Invalid order ID");
    });
    
    it("Should not allow a user to withdraw a refund for an order that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 5)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Withdraw refund
        await expect(buyerContract.withdrawRefund(seller, 0)).to.be.revertedWith("Order does not exist");
    });

    it("Should not allow a user to withdraw a refund that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);
    });

    it("Should not allow a user to withdraw a refund that is currently being processed", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Withdraw refund
        await expect(buyerContract.withdrawRefund(seller, 1)).to.be.revertedWith("A refund is currently being processed");
    });

    it("Should not allow a user to withdraw a refund that has already been declined", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Request refund
        expect(await buyerContract.requestRefund(seller, 1)).to.emit(buyerContract, REFUND_REQUESTED).withArgs(buyer, seller, 1);

        // Resolve refund
        expect(await ownerContract.resolveRefund(buyer, seller, 1, 6)).to.emit(ownerContract, REFUND_RESOLVED).withArgs(buyer, seller, 1);

        // Withdraw refund
        await expect(buyerContract.withdrawRefund(seller, 1)).to.be.revertedWith("A refund has already been declined for this order");
    });

});

describe("Get Order(s)", function () {
    it("Should allow a user to retrieve an order in the role of a buyer", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        const order = await buyerContract.getOrder(buyer, seller, 1);

        expect(order.buyer).to.equal(buyer.address);
        expect(order.seller).to.equal(seller.address);
        expect(order.id).to.equal(1);
    });

    it("Should not allow a user to retrieve an order in the role of a buyer with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(buyerContract.getOrder(ZERO_ADDRESS, seller, 1)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow a user to retrieve an order in the role of a buyer with an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(buyerContract.getOrder(buyer, ZERO_ADDRESS, 1)).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow a user to retrieve an order in the role of a buyer with the same buyer and seller addresses", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(buyerContract.getOrder(buyer, buyer, 1)).to.be.revertedWith("Buyer and seller match");
        await expect(buyerContract.getOrder(seller, seller, 1)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow a user to retrieve an order in the role of a buyer with an invalid order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(buyerContract.getOrder(buyer, seller, 2)).to.be.revertedWith("Invalid order ID");
    });

    it("Should not allow a user to retrieve an order in the role of a buyer that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(buyerContract.getOrder(buyer, seller, 0)).to.be.revertedWith("Order does not exist");
    });

    it("Should not allow a user to retrieve an order they are not involved in", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        const user = accounts[3];
        const userContract = contract.connect(user);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(userContract.getOrder(buyer, seller, 1)).to.be.revertedWith("Unauthorized access");
    });

    it("Should allow a user to retrieve an order in the role of a seller", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        const order = await sellerContract.getOrder(buyer, seller, 1);

        expect(order.buyer).to.equal(buyer.address);
        expect(order.seller).to.equal(seller.address);
        expect(order.id).to.equal(1);
    });

    it("Should not allow a user to retrieve an order in the role of a seller with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(sellerContract.getOrder(ZERO_ADDRESS, seller, 1)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow a user to retrieve an order in the role of a seller with an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(sellerContract.getOrder(buyer, ZERO_ADDRESS, 1)).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow a user to retrieve an order in the role of a seller with the same buyer and seller addresses", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(sellerContract.getOrder(buyer, buyer, 1)).to.be.revertedWith("Buyer and seller match");
        await expect(sellerContract.getOrder(seller, seller, 1)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow a user to retrieve an order in the role of a seller with an invalid order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(sellerContract.getOrder(buyer, seller, 2)).to.be.revertedWith("Invalid order ID");
    });

    it("Should not allow a user to retrieve an order in the role of a seller that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(sellerContract.getOrder(buyer, seller, 0)).to.be.revertedWith("Order does not exist");
    });

    it("Should allow the owner to retrieve any order", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        const order = await ownerContract.getOrder(buyer, seller, 1);

        expect(order.buyer).to.equal(buyer.address);
        expect(order.seller).to.equal(seller.address);
        expect(order.id).to.equal(1);
    });

    it("Should not allow the order to retrieve an order with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(ownerContract.getOrder(ZERO_ADDRESS, seller, 1)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow the owner to retrieve an order with an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(ownerContract.getOrder(buyer, ZERO_ADDRESS, 1)).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow the owner to retrieve an order with the same buyer and seller addresses", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(ownerContract.getOrder(buyer, buyer, 1)).to.be.revertedWith("Buyer and seller match");
        await expect(ownerContract.getOrder(seller, seller, 1)).to.be.revertedWith("Buyer and seller match");
    });

    it("Should not allow the owner to retrieve an order with an invalid order ID", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(ownerContract.getOrder(buyer, seller, 2)).to.be.revertedWith("Invalid order ID");
    });

    it("Should not allow the owner to retrieve an order that does not exist", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(ownerContract.getOrder(buyer, seller, 0)).to.be.revertedWith("Order does not exist");
    });

    it("Should allow a user to retrieve all their orders in the role of a buyer", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        const orders = await buyerContract.getBuyerOrders(buyer);

        expect(orders[0].buyer).to.equal(buyer.address);
        expect(orders[0].seller).to.equal(seller.address);
        expect(orders[0].id).to.equal(1);
    });

    it("Should not allow a user to retrieve all their orders in the role of a buyer with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        const user = accounts[3];
        const userContract = contract.connect(user);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(userContract.getBuyerOrders(ZERO_ADDRESS)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should allow the owner to retrieve all the orders of a buyer", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        const orders = await ownerContract.getBuyerOrders(buyer);

        expect(orders[0].buyer).to.equal(buyer.address);
        expect(orders[0].seller).to.equal(seller.address);
        expect(orders[0].id).to.equal(1);
    });

    it("Should not allow the owner to retrieve all the orders of a buyer with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);
        
        // Get order
        await expect(ownerContract.getBuyerOrders(ZERO_ADDRESS)).to.be.revertedWith("Invalid buyer address");
    });

    it("Should not allow a user to retrieve all the orders of a buyer unless they are involved in them", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        const user = accounts[3];
        const userContract = contract.connect(user);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(userContract.getBuyerOrders(buyer)).to.be.revertedWith("Unauthorized access");
    });

    it("Should allow a user to retrieve all their orders in the role of a seller", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        const orders = await sellerContract.getSellerOrders(seller);

        expect(orders[0].buyer).to.equal(buyer.address);
        expect(orders[0].seller).to.equal(seller.address);
        expect(orders[0].id).to.equal(1);
    });

    it("Should not allow a user to retrieve all their orders in the role of a seller with an invalid seller address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        const user = accounts[3];
        const userContract = contract.connect(user);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(sellerContract.getSellerOrders(ZERO_ADDRESS)).to.be.revertedWith("Invalid seller address");
    });

    it("Should allow the owner to retrieve all the orders of a seller", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        const orders = await ownerContract.getSellerOrders(seller);

        expect(orders[0].buyer).to.equal(buyer.address);
        expect(orders[0].seller).to.equal(seller.address);
        expect(orders[0].id).to.equal(1);
    });

    it("Should not allow the owner to retrieve all the orders of a seller with an invalid buyer address", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const owner = accounts[0];
        const ownerContract = contract.connect(owner);

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);
        
        // Get order
        await expect(ownerContract.getSellerOrders(ZERO_ADDRESS)).to.be.revertedWith("Invalid seller address");
    });

    it("Should not allow a user to retrieve all the orders of a seller unless they are involved in them", async function () {
        // Deploy a clean contract instance
        const { contract } = await loadFixture(deployContractFixture);
        
        // Get available accounts
        const accounts = await ethers.getSigners();

        const buyer = accounts[1];
        const buyerContract = contract.connect(buyer);

        const seller = accounts[2];
        const sellerContract = contract.connect(seller);

        const user = accounts[3];
        const userContract = contract.connect(user);

        // Buy
        expect(await buyerContract.buy(seller, ETH, {"value": ETH})).to.emit(buyerContract, ORDER_PAID).withArgs(buyer, seller, 1);

        // Sell
        expect(await sellerContract.sell(buyer, 1, ETH)).to.emit(sellerContract, ORDER_ACCEPTED).withArgs(buyer, seller, 1);

        // Get order
        await expect(userContract.getSellerOrders(seller)).to.be.revertedWith("Unauthorized access");
    });

});