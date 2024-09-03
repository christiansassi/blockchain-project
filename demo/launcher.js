const { Web3 } = require("web3");
const fs = require("fs");

// Ganache RPC url
const GANACHE_RPC_URL = "http://127.0.0.1:8545"

// Web3 object
const web3 = new Web3(GANACHE_RPC_URL);

// This will be the contract object once deployed
var contract = null;

async function deploy() {

    // Check if the contract has already been deployed
    if(contract !== null)
        return;

    // Add the account from the private key
    const privateKey = "0x18a1aaa10e81e2cc066ba5ae51e0a7f39a0a06c1d4cd91355f4fa3996d4438ce";
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    // Load the compiled contract
    const contractJson = JSON.parse(fs.readFileSync("hardhat/artifacts/contracts/BetaContract.sol/BetaContract.json", "utf8"));
    const contractABI = contractJson.abi;
    const contractBytecode = contractJson.bytecode;

    // Create a contract instance
    const Contract = new web3.eth.Contract(contractABI);

    // Send the transaction
    try {

        // Estimate gas required for deployment
        const gasEstimate = Number(await Contract.deploy({ data: contractBytecode }).estimateGas());

        // Deploy the contract
        contract = await Contract.deploy({ data: contractBytecode }).send({
            from: account.address, // Owner
            gas: gasEstimate,
            gasLimit: gasEstimate * 2, // For safety
        });
    
        console.log("Contract deployed at address:", contract.options.address);
    } 
    catch (error) 
    {
        console.error(error);
    }
}

async function getOwner() {
    return await contract.methods.getOwner().call();
}

async function setOwner() {

    const owner = await getOwner();
    const newOwner = "0xB4627216F33ADfe1d521243f73a884E40368F8A0";

    // Send the transaction
    try {

        // Estimate gas required for deployment
        const gasEstimate = Number(await contract.methods.setOwner(newOwner).estimateGas({
            from: owner
        }));

        // Deploy the contract
        const recepit = await contract.methods.setOwner(newOwner).send({
            from: owner, // Owner
            gas: gasEstimate,
            gasLimit: gasEstimate * 2, // For safety
        });
        
        web3.eth.accounts.wallet.remove(owner);
        web3.eth.accounts.wallet.add(web3.eth.accounts.privateKeyToAccount("0x8e2b0a8ad2a6c502ea7b37273f2070e7e01ab6d08059c94076d6c5f58e3000c3"));

        console.log("Owner:", owner);
    } 
    catch (error) 
    {
        console.error(error);
    }

}

async function main() {
    await deploy();
    await setOwner();
}

main()