// scripts/deploy.js

// Import required Hardhat tools
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    multiSigWalletFactory = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B"
    workerInfo = "0x7f14CCD90b5200F275cdce3A20eB9eB722cb124F"
    // Deploy AICanister contract with dependencies
    console.log("Deploying AICanister contract...");
    const AICanister = await ethers.getContractFactory("AICanister");
    const aiCanister = await AICanister.deploy(multiSigWalletFactory, workerInfo);
    await aiCanister.deployed();
    console.log("AICanister contract deployed to:", aiCanister.address);
}

// Execute the main function and handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error during deployment:", error);
        process.exit(1);
    });
