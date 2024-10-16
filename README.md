# Installation and Configuration

First, clone this repository by running `git clone https://github.com/christiansassi/blockchain-project`

## <img src="https://nodejs.org/static/images/favicons/favicon.png" width="20" style="position: relative; top: 2px; margin-right: 8px;" /> Node.js

1. Download and install Node.js from [here](https://nodejs.org/en/download/package-manager).
2. Install the required packages by running `npm install`

## <img src="https://www.python.org/static/favicon.ico" width="20" style="position: relative; top: 2px; margin-right: 8px;" /> Python

1. Download and install Python from [here](https://www.python.org/downloads/).
2. Install the required packages by running `pip install -r requirements.txt`

## <img src="https://archive.trufflesuite.com/img/ganache-logomark.svg" width="20" style="position: relative; top: 2px; margin-right: 8px;" /> Ganache

1. Install Ganache CLI by running `npm install ganache --global`

## <img src="https://remix-project.org/favicon.ico" width="30" style="position: relative; top: 6px; margin-right: 8px;" /> Remix - Ethereum IDE
        
### Remix Desktop IDE (preferred)

1. Download and install Remix Desktop IDE from [here](https://github.com/remix-project-org/remix-desktop-insiders/releases).
2. After installation, click `File > Open Folder` in the top-left corner, then select your project folder.
    
### Remix Online IDE

1. Install the npm package by running `npm install @remix-project/remixd --global`
2. Start the Remix daemon inside your project directory. Navigate to your project folder and run `remixd -s .`
3. Open the Remix Online IDE [here](https://remix.ethereum.org/), and in the top-left corner, under the workspace section, select `connect to localhost`.

## <img src="https://github.com/MetaMask/brand-resources/raw/master/SVG/SVG_MetaMask_Icon_Color.svg" width="30" style="position: relative; top: 6px; margin-right: 8px;" /> MetaMask

1. Download and intsall MetaMask from [here](https://metamask.io/download/).
2. Click on `Import an existing wallet` and enter the following mnemonic phrase: `museum coin tiger catalog dutch doll daring toddler festival cushion fuel nest`. This mnemonic will be used by Ganache when you run the demo.
3. Click on `+ Add Network > Add a network manually` and set the following:
   - **Network Name**: `Ganache`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`

By default, MetaMask will add the address at index 0, which is `0x40271F69d03387d2C4868B01F8b003D91c247358`. To use other addresses, go to MetaMask and click `+ Add account or hardware wallet > Import account`. Copy and paste the private key for the chosen account. For example, to import the second account (index 1), use the private key `0x8e2b0a8ad2a6c502ea7b37273f2070e7e01ab6d08059c94076d6c5f58e3000c3`, as shown in the Ganache console when you run the local Ethereum blockchain.


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

# Contacts

Matteo Beltrami - [matteo.beltrami-1@studenti.unitn.it](mailto:matteo.beltrami-1@studenti.unitn.it)

Luca Pedercini - [luca.pedercini@studenti.unitn.it](mailto:luca.pedercini@studenti.unitn.it)

Christian Sassi - [christian.sassi@studenti.unitn.it](mailto:christian.sassi@studenti.unitn.it)

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/extras/dark.png">
    <img alt="https://www.unitn.it/" src="assets/extras/light.png" width="300px">
</picture>
