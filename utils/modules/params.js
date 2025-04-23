const path = require("path");

const RPC_URL = "http://127.0.0.1:8545";

const CONTRACT_NAME = "Janus";

const ABI_FILE_IN = path.join(__dirname, "../../contracts/artifacts/contracts", `${CONTRACT_NAME}.sol`, `${CONTRACT_NAME}.json`);
const ABI_FILE_OUT = path.join(__dirname, "../../demo/static/abi", "abi.json");

module.exports = {RPC_URL, CONTRACT_NAME, ABI_FILE_IN, ABI_FILE_OUT};