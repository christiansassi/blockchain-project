# Installation and Configuration

First, clone this repository by running `git clone https://github.com/christiansassi/blockchain-project`

## <img src="https://nodejs.org/static/images/favicons/favicon.png" width="20" style="position: relative; top: 2px; margin-right: 8px;" /> Node.js

1. Download and install Node.js from [here](https://nodejs.org/en/download/package-manager).
2. Install the required packages by running `npm install`

## <img src="https://archive.trufflesuite.com/img/ganache-logomark.svg" width="20" style="position: relative; top: 2px; margin-right: 8px;" /> Ganache

1. Install Ganache CLI by running `npm install ganache --global`

## <img src="https://remix-project.org/favicon.ico" width="30" style="position: relative; top: 6px; margin-right: 8px;" /> Remix - Ethereum IDE
        
### Remix Desktop IDE (preferred)

1. Download and install Remix Desktop IDE from [here](https://github.com/remix-project-org/remix-desktop-insiders/releases).
2. After installation, click `File > Open Folder` in the top-left corner, then select your project folder.
    
### Remix Online IDE

1. Install the npm package by running `npm i -g @remix-project/remixd`
2. Start the Remix daemon inside your project directory. Navigate to your project folder and run `remixd -s .`
3. Open the Remix Online IDE [here](https://remix.ethereum.org/), and in the top-left corner, under the workspace section, select `connect to localhost`.

# Getting Started

## Running Tests

These commands execute the test cases inside the [tests.js](test/tests.js) file. The test cases are designed to verify the correct functioning of the contract by creating various scenarios that test its functionalities and check for potential bugs in the contract logic. Specifically, the test cases also ensure that every `require` statement within the contract works as intended.

You can run one of the following commands:

```bash
# Rebuild the contract before running the tests
npm run test:build

# To run the tests. 
# Note that if the contract is not compiled, Hardhat will compile it for you
npm run test
```

## Play with the contract

1. In the Remix IDE, open the Solidity contract.
2. Click on `Solidity Compiler` in the left sidebar and compile the contract.
3. Click on `Deploy & Run Transactions` in the left sidebar and deploy the contract using the `Deploy` button.

You can now test the contract's functions by expanding the contract window within the `Deployed Contracts` section.

> [!WARNING]
> If you want to deploy the contract again, remove the already deployed contract by clicking on the trash icon.

> [!TIP]
> If you would like to reset the wallets (e.g., restore the balances), simply select and reselect the same environment (e.g., `Remix VM (Shanghai)`).

## Running Demo

1. Build the contract by running, in the project folder, `npm run compile`
2. Create a new workspace in Ganache by running `ganache --port 8545 --wallet.seed "31612E" --accounts 10 --defaultBalanceEther 100`. This will create a local Ethereum blockchain on `http://127.0.0.1:8545` with 10 accounts with 100 ETH on them.

> [!WARNING]
> Do not close the window unless you are running Ganache in deamon mode.

> [!WARNING]
> The first two addresses, `0x40271F69d03387d2C4868B01F8b003D91c247358` and `0xB4627216F33ADfe1d521243f73a884E40368F8A0`, are reserved. The first address is used to deploy the contract and is then discarded to avoid affecting the balance of the other addresses. The second address represents the (new) owner.
