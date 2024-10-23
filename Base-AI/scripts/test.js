// scripts/test.js

const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing contracts with account:", deployer.address);

    multiSigWalletFactory = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B"
    workerInfo = "0x7f14CCD90b5200F275cdce3A20eB9eB722cb124F"
    
    // Deploy AICanister contract
    const AICanister = await ethers.getContractFactory("AICanister");
    const aiCanister = await AICanister.deploy(multiSigWalletFactory, workerInfo);
    await aiCanister.deployed();
    console.log("AICanister contract deployed to:", aiCanister.address);

    // Register a worker
    const skillset = "Solidity, JavaScript";
    await workerInfo.registerWorker(skillset);
    console.log(`Worker registered with skillset: ${skillset}`);

    // Create a job
    const requiredExperience = 2;  // Example values
    const requiredSkillLevel = 3;   // Example values
    await multiSigWalletFactory.createJob(
        [deployer.address],  // Owners for multisig wallet
        1,                  // Required approvals
        "Smart Contract Developer",  // Job title
        "Develop a smart contract",  // Job description
        "Complete project milestones", // Job milestones
        ethers.utils.parseEther("1.0")  // Payment in wei
    );
    console.log("Job created.");

    // Predict worker score
    const workerAddress = deployer.address;  // Using the deployer as the worker
    const jobId = 0; // Assuming it's the first job created
    const predictedScore = await aiCanister.predictWorkerScore(workerAddress, jobId);
    console.log("Predicted worker score:", predictedScore.toString());

    // Find the best match for the job
    const bestWorker = await aiCanister.findBestMatch(jobId);
    console.log("Best matching worker address:", bestWorker);
}

// Execute the main function
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error during testing:", error);
        process.exit(1);
    });
