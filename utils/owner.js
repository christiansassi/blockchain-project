const {RPC_URL, CONTRACT_NAME, ABI_FILE_OUT} = require("./modules/params");
const utils = require("./modules/utils");

const Web3 = require("web3");
const web3 = new Web3(RPC_URL);

var ora = null;

const fs = require("fs");

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var contract = null;

const STATUS_MAP = {
    "0": "None",
    "1": "Paid",
    "2": "Accepted",
    "3": "Completed",
    "4": "Refund pending",
    "5": "Refund accepted",
    "6": "Refund declined"
};

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

async function loadContract() {
    const spinner = ora(`Loading ${CONTRACT_NAME} contract...`).start();

    while(!fs.existsSync(ABI_FILE_OUT))
        await utils.sleep(1000);

    const deployed = JSON.parse(fs.readFileSync(ABI_FILE_OUT));
    contract = new web3.eth.Contract(deployed.abi, deployed.address);

    spinner.succeed(`${CONTRACT_NAME} deployed to ${deployed.address}`);
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000); // timestamp is in seconds

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function prompt(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function main() {

    ora = (await import("ora")).default;

    await waitForHardhatNode();
    await loadContract();

    const spinner = ora(`Adding owner account...`).start();

    const account = web3.eth.accounts.privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    web3.eth.accounts.wallet.add(account);
    const owner = account.address;

    spinner.succeed(`Successfully added owner account`);

    // TODO
    // contract.events.RefundRequested({
    //     fromBlock: "latest"
    // })
    // .on("data", (event) => {
    //     const { buyer, seller, id } = event.returnValues;
    //     console.log("RefundRequested Event:", { buyer, seller, id });
    // })
    // .on("error", console.error);

    // contract.events.RefundRevoked({
    //     fromBlock: "latest"
    // })
    // .on("data", (event) => {
    //     const { buyer, seller, id } = event.returnValues;
    //     console.log("RefundRevoked Event:", { buyer, seller, id });
    // })
    // .on("error", console.error);

    while(true) {

        utils.clearScreen();

        console.log(`
   $$$$$\\                                                              $$$$$$\\  $$\\      $$\\ $$\\   $$\\ $$$$$$$$\\ $$$$$$$\\  
   \\__$$ |                                                            $$  __$$\\ $$ | $\\  $$ |$$$\\  $$ |$$  _____|$$  __$$\\ 
      $$ | $$$$$$\\  $$$$$$$\\  $$\\   $$\\  $$$$$$$\\                     $$ /  $$ |$$ |$$$\\ $$ |$$$$\\ $$ |$$ |      $$ |  $$ |
      $$ | \\____$$\\ $$  __$$\\ $$ |  $$ |$$  _____|      $$$$$$\\       $$ |  $$ |$$ $$ $$\\$$ |$$ $$\\$$ |$$$$$\\    $$$$$$$  |
$$\\   $$ | $$$$$$$ |$$ |  $$ |$$ |  $$ |\\$$$$$$\\        \\______|      $$ |  $$ |$$$$  _$$$$ |$$ \\$$$$ |$$  __|   $$  __$$< 
$$ |  $$ |$$  __$$ |$$ |  $$ |$$ |  $$ | \\____$$\\                     $$ |  $$ |$$$  / \\$$$ |$$ |\\$$$ |$$ |      $$ |  $$ |
\\$$$$$$  |\\$$$$$$$ |$$ |  $$ |\\$$$$$$  |$$$$$$$  |                     $$$$$$  |$$  /   \\$$ |$$ | \\$$ |$$$$$$$$\\ $$ |  $$ |
 \\______/  \\_______|\\__|  \\__| \\______/ \\_______/                      \\______/ \\__/     \\__|\\__|  \\__|\\________|\\__|  \\__|
                                                                                                                           
                                                                                                                           
                                                                                                                           
                                                                                $$\\                                        
                                                                                $$ |                                       
                               $$$$$$$\\  $$$$$$\\  $$$$$$$\\   $$$$$$$\\  $$$$$$\\  $$ | $$$$$$\\                               
                              $$  _____|$$  __$$\\ $$  __$$\\ $$  _____|$$  __$$\\ $$ |$$  __$$\\                              
                              $$ /      $$ /  $$ |$$ |  $$ |\\$$$$$$\\  $$ /  $$ |$$ |$$$$$$$$ |                             
                              $$ |      $$ |  $$ |$$ |  $$ | \\____$$\\ $$ |  $$ |$$ |$$   ____|                             
                              \\$$$$$$$\\ \\$$$$$$  |$$ |  $$ |$$$$$$$  |\\$$$$$$  |$$ |\\$$$$$$$\\                              
                               \\_______| \\______/ \\__|  \\__|\\_______/  \\______/ \\__| \\_______|
        `);

        console.log("\n\n");

        const buyer = await prompt("Buyer: ");
        const seller = await prompt("Seller: ");
        const id = await prompt("ID: ");
        
        try {

            const result = await contract.methods.getOrder(buyer, seller, id).call();
            
            const orderBuyer = result.buyer;
            const orderSeller = result.seller;
            const orderId = result.id;
            const orderPrice = result.price;
            const orderCreationDate = result.creationDate;
            const orderStatus = result.status;

            console.log("\n=================== Order Info ===================");
            console.log(`Buyer: ${orderBuyer}`);
            console.log(`Seller: ${orderSeller}`);
            console.log(`ID: ${orderId}`);
            console.log(`Price: ${web3.utils.fromWei(orderPrice, "ether")} ETH`);
            console.log(`Creation Date: ${formatTimestamp(orderCreationDate)}`);
            console.log(`Status: ${STATUS_MAP[orderStatus]}`);
            console.log("===================================================");
            
            if(orderStatus == "4")
            {
                const newStatus = await prompt("\nNew Refund Status: ");
                
                if(newStatus == "5" || newStatus == "6") {
                    
                    const estimatedGas = await contract.methods.resolveRefund(orderBuyer, orderSeller, orderId, newStatus).estimateGas({ from: owner });
                    const gas = Math.floor(estimatedGas * 1.2);

                    await contract.methods.resolveRefund(orderBuyer, orderSeller, orderId, newStatus).send({from: owner, gas});

                    try {

                    } catch(error) {
                        console.log(error);
                    }
                }

            }
        } catch(error) {
            console.log(error);
        }

        await prompt("");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
