# Installation and Configuration

First, clone this repository by running `git clone https://github.com/christiansassi/blockchain-project`

## <img src="https://nodejs.org/static/images/favicons/favicon.png" width="20" style="position: relative; top: 2px; margin-right: 8px;" /> Node.js

1. Download and install Node.js from [here](https://nodejs.org/en/download/package-manager).
2. Install the required packages by running `npm install`

## <img src="https://archive.trufflesuite.com/img/ganache-logomark.svg" width="20" style="position: relative; top: 2px; margin-right: 8px;" /> Ganache

1. Download and install ganache from [here](https://archive.trufflesuite.com/ganache/).
2. After installation, create a new workspace by clicking on NEW WORKSPACE. Choose a name for your workspace, then click SAVE.

## <img src="https://remix-project.org/favicon.ico" width="30" style="position: relative; top: 6px; margin-right: 8px;" /> Remix - Ethereum IDE
        
### Remix Desktop IDE (preferred)

1. Download and install Remix Desktop IDE from [here](https://github.com/remix-project-org/remix-desktop-insiders/releases).
2. After installation, click `File > Open Folder` in the top-left corner, then select your project folder.
    
### Remix Online IDE

1. Install the npm package by running `npm i -g @remix-project/remixd`
2. Start the Remix daemon inside your project directory. Navigate to your project folder and run `remixd -s .`
3. Open the Remix Online IDE [here](https://remix.ethereum.org/), and in the top-left corner, under the workspace section, select `connect to localhost`.

# Getting Started

1. Start the workspace you just created in Ganache.
2. In the Remix IDE, click on `Solidity Compiler` in the left sidebar and compile the contract using version `0.8.19`.
3. Next, click on `Deploy & Run Transactions` in the left sidebar and select `Custom - External Http Provider` as the environment. In the popup window, enter the Ganache RPC server URL of your workspace, for example, `http://127.0.0.1:7545`.

## Running Tests

You can run one of the following commands:

```bash
# Use this command if you want to remove any previously compiled files (if any) and rebuild them before running the tests
npm run test:clean

# Use this command if you just want to run the tests. 
# Note that if the contract is not compiled, Hardhat will compile it for you
npm run test
```