<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="demo/static/assets/logo-extended-dark-mode.png">
        <img alt="https://www.unitn.it/" src="demo/static/assets/logo-extended-light-mode.png" width="75%">
    </picture>
</p>

# Table of Contents

1. [Installation and Configuration](#installation-and-configuration)  
   - [Node.js](#nodejs)  
   - [Python](#python)  
   - [Ganache](#ganache)  
   - [Remix - Ethereum IDE](#remix---ethereum-ide)  
     - [Remix Desktop IDE (preferred)](#remix-desktop-ide-preferred)  
     - [Remix Online IDE](#remix-online-ide)  
   - [MetaMask](#metamask)  

2. [Getting Started](#getting-started)  
   - [Running Tests](#running-tests)  
   - [Play with the Contract](#play-with-the-contract)  
   - [Run the Demo](#run-the-demo)  

3. [Contacts](#contacts)

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
3. Click on `+ Add Network > Add a custom network` and set the following:
   - **Network Name**: `Ganache`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`

By default, MetaMask will add the address at index 0, which is `0x40271F69d03387d2C4868B01F8b003D91c247358`. To use other addresses, go to MetaMask and click `+ Add account or hardware wallet > Import account`. Copy and paste the private key for the chosen account. For example, to import the second account (index 1), use the private key `0x8e2b0a8ad2a6c502ea7b37273f2070e7e01ab6d08059c94076d6c5f58e3000c3`, as shown in the Ganache console when you run the local Ethereum blockchain. Alternatively, you can click on `Add new Ethereum account`, and MetaMask will automatically select the next available account in order from the generated ones.  

# Getting Started

## Running Tests

These commands execute the test cases inside the [tests.js](test/tests.js) file. The test cases are designed to verify the correct functioning of the contract by creating various scenarios that test its functionalities and check for potential bugs in the contract logic. Specifically, the test cases also ensure that every `require` statement within the contract works as intended.

You can run one of the following commands:

```bash
# Rebuild the contract before running the tests
npm run tests:compile

# To run the tests. 
# Note that if the contract is not compiled, Hardhat will compile it for you
npm run tests
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

## Run the Demo

1. Run Ganache on `localhost` (port `8545`) with the specified mnemonic to initialize accounts:
```bash
ganache -h 0.0.0.0 -p 8545 --mnemonic "museum coin tiger catalog dutch doll daring toddler festival cushion fuel nest"
```
2. In the Remix IDE:
    - Open the Solidity contract.
    - Click on `Solidity Compiler` in the left sidebar and compile the contract.
    - Click on `Deploy & Run Transactions` in the left sidebar and set the environment to `Custom - External Http Provider`. 
    - In the popup window, enter the Ganache RPC URL: `http://127.0.0.1:8545`.
    - Click `Deploy` to deploy the contract.

3. Execute the [demo.py](demo/demo.py) script:

```bash
python demo.py
```

4. Click on `Run demo` on the main page to start the demo.  
5. A new window will open, prompting you to choose which entity to impersonate: **Seller** or **Buyer**.  
   - Since this is a demo, it is recommended to open two separate browser windows so you can impersonate both roles simultaneously.  
6. After selecting an entity, you will be redirected to the corresponding interface. A MetaMask popup will appear, where you need to:  
   - Select the account you want to use (make sure it has been added as explained in the previous steps).  
   - Choose the appropriate network—select `Ganache`. Be sure to have `Show test networks` checked.  

   ⚠️ To ensure a smooth experience, it is recommended to:  
   - **Deselect all other accounts except the one created with Ganache**. 
   - **Deselect all networks except the Ganache network**.  
   - **Make sure that only MetaMask is installed, or that it is set as the default wallet.** Otherwise, other wallets may interfere with the demo, causing it to malfunction. For example, if both MetaMask and Phantom are installed, Phantom may appear when the demo attempts to open the wallet popup. If you close the Phantom popup, the page may not handle the event correctly, disrupting the demo flow. While this issue could be addressed, it is beyond the scope of this project, as the demo is designed specifically for MetaMask.

# Contacts

Matteo Beltrami - [matteo.beltrami-1@studenti.unitn.it](mailto:matteo.beltrami-1@studenti.unitn.it)

Luca Pedercini - [luca.pedercini@studenti.unitn.it](mailto:luca.pedercini@studenti.unitn.it)

Christian Sassi - [christian.sassi@studenti.unitn.it](mailto:christian.sassi@studenti.unitn.it)

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/extras/dark.png">
    <img alt="https://www.unitn.it/" src="assets/extras/light.png" width="300px">
</picture>
