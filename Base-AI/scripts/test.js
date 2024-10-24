const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing contracts with account:", deployer.address);

    const multiSigWalletFactoryAddress = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B"; // Already deployed contract address
    const workerInfoAddress = "0x7f14CCD90b5200F275cdce3A20eB9eB722cb124F"; // Already deployed contract address

    // Attach to the already deployed WorkerInfo and MultiSigWalletFactory contracts
    const WorkerInfo = await ethers.getContractFactory("WorkerInfo_MetaTasker");
    const workerInfo = await WorkerInfo.attach(workerInfoAddress);

    const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWalletFactory");
    const multiSigWalletFactory = await MultiSigWalletFactory.attach(multiSigWalletFactoryAddress);

    // Deploy AICanister contract
    const AICanister = await ethers.getContractFactory("AICanister");
    const aiCanister = await AICanister.deploy(multiSigWalletFactory.address, workerInfo.address);
    await aiCanister.deployed();
    console.log("AICanister contract deployed to:", aiCanister.address);

    // Randomly generate and register workers in batches to avoid gas issues
    const numWorkers = 1000;  // Number of workers to create
    const batchSize = 100;    // Register in batches of 100
    for (let batchStart = 0; batchStart < numWorkers; batchStart += batchSize) {
        console.log(`Registering workers from ${batchStart + 1} to ${Math.min(batchStart + batchSize, numWorkers)}`);
        
        for (let i = batchStart; i < Math.min(batchStart + batchSize, numWorkers); i++) {
            const experience = Math.floor(Math.random() * 10) + 1;  // Random experience between 1 and 10
            const skillLevel = Math.floor(Math.random() * 10) + 1;  // Random skill level between 1 and 10

            try {
                // Check if worker already exists before registering
                const workerExists = await aiCanister.workerExists(i);
                if (!workerExists) {
                    await aiCanister.registerWorker(experience, skillLevel);
                    console.log(`Worker ${i + 1} registered with experience: ${experience}, skillLevel: ${skillLevel}`);
                } else {
                    console.log(`Worker ${i + 1} already registered, skipping...`);
                }
            } catch (error) {
                console.error(`Error registering worker ${i + 1}:`, error);
            }
        }

        // Pause between batches to avoid gas issues or potential rate limits
        console.log(`Batch ${Math.floor(batchStart / batchSize) + 1} completed. Pausing for a few seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Pause for 3 seconds
    }

    // Randomly generate and create jobs
    const numJobs = 100;  // Number of jobs to create
    for (let i = 0; i < numJobs; i++) {
        const requiredExperience = Math.floor(Math.random() * 10) + 1;  // Random experience requirement
        const requiredSkillLevel = Math.floor(Math.random() * 10) + 1;  // Random skill level requirement
        const title = `Job ${i + 1}`;
        const description = `Description for job ${i + 1}`;
        const milestones = `Milestones for job ${i + 1}`;
        const payment = ethers.utils.parseEther((Math.random() * 2 + 0.1).toFixed(3));  // Random payment between 0.1 and 2.1 ETH

        try {
            await multiSigWalletFactory.createJob(
                [deployer.address],  // Owners for multisig wallet
                1,                   // Required approvals
                title,               // Job title
                description,          // Job description
                milestones,           // Job milestones
                payment               // Payment in wei
            );
            console.log(`Job ${i + 1} created with title: ${title}, payment: ${payment.toString()}`);
        } catch (error) {
            console.error(`Error creating job ${i + 1}:`, error);
        }
    }

    // Match workers to jobs based on experience and skill level
    for (let jobId = 0; jobId < numJobs; jobId++) {
        try {
            const bestWorker = await aiCanister.findBestMatch(jobId);
            console.log(`Best matching worker for Job ${jobId + 1}: Worker ID ${bestWorker}`);
        } catch (error) {
            console.error(`Error finding best match for Job ${jobId + 1}:`, error);
        }
    }
}

// Execute the main function
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error during testing:", error);
        process.exit(1);
    });
