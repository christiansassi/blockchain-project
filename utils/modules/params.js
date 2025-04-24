const path = require("path");

const HTTP_RPC_URL = "http://127.0.0.1:8545";
const WS_RPC_URL = "ws://127.0.0.1:8545";

const CONTRACT_NAME = "Janus";

const ABI_FILE_IN = path.join(__dirname, "../../contracts/artifacts/contracts", `${CONTRACT_NAME}.sol`, `${CONTRACT_NAME}.json`);
const ABI_FILE_OUT = path.join(__dirname, "../../demo/static/abi", "abi.json");

const OWNER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

module.exports = {HTTP_RPC_URL, WS_RPC_URL, CONTRACT_NAME, ABI_FILE_IN, ABI_FILE_OUT, OWNER_PRIVATE_KEY};