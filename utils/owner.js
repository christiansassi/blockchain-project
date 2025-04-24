const { HTTP_RPC_URL, WS_RPC_URL, CONTRACT_NAME, ABI_FILE_OUT, OWNER_PRIVATE_KEY } = require("./modules/params");
const utils = require("./modules/utils");
const Web3 = require("web3");
const fs = require("fs");
const readline = require("readline");
var ora = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let web3Http = new Web3(HTTP_RPC_URL);

const web3WsProvider = new Web3.providers.WebsocketProvider(WS_RPC_URL, {
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false
    }
});

web3WsProvider.on("connect", () => console.log("WebSocket connected"));
web3WsProvider.on("error", e => console.error("WebSocket error", e));
web3WsProvider.on("end", e => console.error("WebSocket ended", e));

const web3Ws = new Web3(web3WsProvider);

let contract = null;

const STATUS_MAP = {
    "0": "None",
    "1": "Paid",
    "2": "Accepted",
    "3": "Completed",
    "4": "Refund pending",
    "5": "Refund accepted",
    "6": "Refund declined"
};

let orders = {};

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function prompt(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function waitForHardhatNode() {
    const spinner = ora(`Waiting for Hardhat node...`).start();
    while (true) {
        try {
            await web3Http.eth.getChainId();
            spinner.succeed(`Hardhat node started at ${HTTP_RPC_URL}`);
            return;
        } catch {
            await utils.sleep(1000);
        }
    }
}

async function waitForWebSocketConnection() {
    return new Promise((resolve, reject) => {
        const spinner = ora("Connecting to WebSocket...").start();

        const webSocket = web3WsProvider.connection;

        if (webSocket && webSocket.readyState === 1) {
            spinner.succeed("WebSocket connection established.");
            resolve();
            return;
        }

        web3WsProvider.on("connect", () => {
            spinner.succeed("WebSocket connection established.");
            resolve();
        });

        web3WsProvider.on("error", (e) => {
            spinner.fail("WebSocket connection error.");
            reject(e);
        });
    });
}

async function loadContract() {
    const spinner = ora(`Loading ${CONTRACT_NAME} contract...`).start();
    while (!fs.existsSync(ABI_FILE_OUT)) {
        await utils.sleep(1000);
    }

    const deployed = JSON.parse(fs.readFileSync(ABI_FILE_OUT));
    contract = {
        call: new web3Http.eth.Contract(deployed.abi, deployed.address),
        events: new web3Ws.eth.Contract(deployed.abi, deployed.address)
    };
    spinner.succeed(`${CONTRACT_NAME} deployed to ${deployed.address}`);
}

async function subscribeToEvents() {
    contract.events.events.RefundRequested({ fromBlock: "latest" })
        .on("data", (event) => {
            const { buyer, seller, id } = event.returnValues;
            //console.log("RefundRequested Event:", { buyer, seller, id });
            orders[`${seller}-${id}`] = {
                "buyer": buyer,
                "seller": seller,
                "id": id
            }
        })
        .on("error", console.error);

    contract.events.events.RefundRevoked({ fromBlock: "latest" })
        .on("data", (event) => {
            const { buyer, seller, id } = event.returnValues;
            //console.log("RefundRevoked Event:", { buyer, seller, id });
            delete orders[`${seller}-${id}`]
        })
        .on("error", console.error);
}

async function main() {

    ora = (await import("ora")).default;

    await waitForHardhatNode();
    await waitForWebSocketConnection();
    await loadContract();
    await subscribeToEvents();

    const ownerAccount = web3Http.eth.accounts.privateKeyToAccount(OWNER_PRIVATE_KEY);
    web3Http.eth.accounts.wallet.add(ownerAccount);
    const owner = ownerAccount.address;

    ora().succeed("Owner account added.");

    while (true) {
        utils.clearScreen();

        for(let key in orders) {
            details = orders[key];

            console.log("\n=================== Order Info ===================");
            console.log(`Buyer: ${details.buyer}`);
            console.log(`Seller: ${details.seller}`);
            console.log(`ID: ${details.id}`);
            console.log("===================================================");
        }

        if(Object.keys(orders).length) {
            console.log("\n")

            const buyer = await prompt("Buyer: ");
            
            if(!web3Http.utils.isAddress(buyer))
                continue

            const seller = await prompt("Seller: ");

            if(!web3Http.utils.isAddress(seller))
                continue

            const id = await prompt("ID: ");

            if(!Number.isInteger(Number(id)))
                continue

            try {
                const result = await contract.call.methods.getOrder(buyer, seller, id).call();

                console.log("\n=================== Order Info ===================");
                console.log(`Buyer: ${result.buyer}`);
                console.log(`Seller: ${result.seller}`);
                console.log(`ID: ${result.id}`);
                console.log(`Price: ${web3Http.utils.fromWei(result.price, "ether")} ETH`);
                console.log(`Creation Date: ${formatTimestamp(result.creationDate)}`);
                console.log(`Status: ${STATUS_MAP[result.status]}`);
                console.log("===================================================");
                
                const newStatus = await prompt("\nNew Refund Status (5 = accept, 6 = decline): ");

                if (newStatus === "5" || newStatus === "6") {
                    const estimatedGas = await contract.call.methods.resolveRefund(buyer, seller, id, newStatus).estimateGas({ from: owner });
                    const gas = Math.floor(estimatedGas * 1.2);
                    await contract.call.methods.resolveRefund(buyer, seller, id, newStatus).send({ from: owner, gas });
                    console.log("Refund status updated.");
                }

            } catch(error) {

            }

            await prompt("Press Enter to continue...");
        }
        else
            await utils.sleep(1000);
    }
}

main().catch(err => {
    console.error("Unhandled error:", err);
    process.exitCode = 1;
});
