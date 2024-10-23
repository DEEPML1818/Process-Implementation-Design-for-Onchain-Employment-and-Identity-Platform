// scripts/deploy.js

// Import required Hardhat tools
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy Security contract
    console.log("Deploying Security contract...");
    const Security = await ethers.getContractFactory("Security_MetaTasker");
    const security = await Security.deploy();
    await security.deployed();
    console.log("Security contract deployed to:", security.address);

    // Deploy MultiSigWalletFactory contract
    console.log("Deploying MultiSigWalletFactory contract...");
    const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWalletFactory");
    const multiSigWalletFactory = await MultiSigWalletFactory.deploy(security.address);
    await multiSigWalletFactory.deployed();
    console.log("MultiSigWalletFactory contract deployed to:", multiSigWalletFactory.address);

    // Deploy WorkerInfo contract with the address of MultiSigWalletFactory
    console.log("Deploying WorkerInfo contract...");
    const WorkerInfo = await ethers.getContractFactory("WorkerInfo_MetaTasker");
    const workerInfo = await WorkerInfo.deploy(multiSigWalletFactory.address);
    await workerInfo.deployed();
    console.log("WorkerInfo contract deployed to:", workerInfo.address);

    // Deploy AICanister contract with dependencies
    console.log("Deploying AICanister contract...");
    const AICanister = await ethers.getContractFactory("AICanister");
    const aiCanister = await AICanister.deploy(multiSigWalletFactory.address, workerInfo.address);
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
