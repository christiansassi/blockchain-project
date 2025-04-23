const {RPC_URL, CONTRACT_NAME, ABI_FILE_IN, ABI_FILE_OUT} = require("./modules/params");

const Web3 = require("web3");
const web3 = new Web3(RPC_URL);

var ora = null;

const fs = require("fs");

async function waitForHardhatNode() {

    // Wait for connection

    const spinner = ora(`Waiting for Hardhat node...`).start();

    while(true) {

        try {

            if(await web3.eth.getChainId())
            {
                spinner.succeed(`Hardhat node started at ${RPC_URL}`);
            }
                return;
        }
        catch(error) {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
}

async function deployContract() {

    const spinner = ora(`Compiling ${CONTRACT_NAME}...`).start();

    try {
        
        spinner.text = `Deploying ${CONTRACT_NAME} contract...`;

        // Get the ContractFactory
        const Contract = await ethers.getContractFactory(CONTRACT_NAME);

        // Deploy the contract
        const contract = await Contract.deploy();
        
        spinner.text = "Waiting for deployment confirmation...";

        // Wait for deployment to complete
        await contract.waitForDeployment();
        
        spinner.succeed(`${CONTRACT_NAME} deployed to ${await contract.getAddress()}`);
        return contract;

    } catch(error) {
        spinner.fail(`Deployment failed: ${e}`);
        throw e;
    }
}

async function exportAbi(address) {

    const spinner = ora(`Exporting ${CONTRACT_NAME} ABI...`).start();

    const abi = JSON.parse(
        fs.readFileSync(ABI_FILE_IN)
    ).abi;

    const deployed = {
        address: address,
        abi: abi
    };

    const abiPath = ABI_FILE_OUT;
    fs.writeFileSync(abiPath, JSON.stringify(deployed, null, 4));

    spinner.succeed(`${CONTRACT_NAME} ABI exported to "demo/abi.json"`);
}

async function main() {

    ora = (await import("ora")).default;

    if(fs.existsSync(ABI_FILE_OUT))
        fs.unlinkSync(ABI_FILE_OUT);

    await waitForHardhatNode();
    contract = await deployContract();
    await exportAbi(await contract.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
