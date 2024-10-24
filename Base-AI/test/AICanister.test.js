    // test/AICanister.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("AICanister Contract", function () {
    let AICanister;
    let aiCanister;
    let workerInfo;
    let factory;
    let owner;
    let addr1;
    let addr2;
    

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        const WorkerInfo = await ethers.getContractFactory("WorkerInfo_MetaTasker");
        const Factory = await ethers.getContractFactory("MultiSigWalletFactory");
        const AICanister = await ethers.getContractFactory("AICanister");

        // Deploy WorkerInfo and Factory contracts
        workerInfo = await WorkerInfo.deploy("0xb923DcE82100aBF8181354e9572ed6C61De8C52B");
        await workerInfo.deployed();

        factory = await Factory.deploy("0x924dCF44a61Cb846155651b3bc81CaD4Db38D09D");
        await factory.deployed();

        // Deploy AICanister with the addresses of WorkerInfo and Factory
        aiCanister = await AICanister.deploy(workerInfo.address, factory.address);
        await aiCanister.deployed();

        // Get signers
        [owner, addr1] = await ethers.getSigners();
    });
    
    describe("Worker Registration", function () {
        it("should register a new worker", async function () {
            const experience = 5;
            const skillLevel = 3;

            await aiCanister.connect(owner).registerWorker(3, 4);

            const worker = await aiCanister.workers(owner.address);
            expect(worker.exists).to.be.true;
            expect(worker.experience).to.equal(3);
            expect(worker.skillLevel).to.equal(4);
        });

        it("should not allow a worker to register twice", async function () {
            await aiCanister.connect(owner).registerWorker(5, 3);
            await expect(aiCanister.connect(owner).registerWorker(5, 3))
                .to.be.revertedWith("Worker already exists");
        });
    });

    describe("Job Creation", function () {
        it("should create a new job", async function () {
            const requiredExperience = 3;
            const requiredSkillLevel = 2;

            await aiCanister.connect(owner).createJob(requiredExperience, requiredSkillLevel);

            const job = await aiCanister.jobs(0);
            expect(job.requiredExperience).to.equal(requiredExperience);
            expect(job.requiredSkillLevel).to.equal(requiredSkillLevel);
            expect(job.isActive).to.be.true;
        });
    });

    describe("Predict Worker Score", function () {
        beforeEach(async function () {
            // Register a worker and create a job for testing
            await aiCanister.connect(owner).registerWorker(5, 3);
            await aiCanister.connect(owner).createJob(4, 2);
        });

        it("should predict the worker score correctly", async function () {
            const score = await aiCanister.predictWorkerScore(owner.address, 0);
            expect(score).to.equal(1 + 2 * 5 + 3 * 3); // 1 + 10 + 9 = 20
        });

        it("should not allow prediction for a non-existent worker", async function () {
            await expect(aiCanister.predictWorkerScore(addr1.address, 0))
                .to.be.revertedWith("Worker not found");
        });

        it("should not allow prediction for an inactive job", async function () {
            await aiCanister.connect(owner).createJob(4, 2);
            // Deactivate the job using the new function
            await aiCanister.connect(owner).deactivateJob(0);
        
            await expect(aiCanister.predictWorkerScore(owner.address, 0))
                .to.be.revertedWith("Job is not active");
        });
    });

    describe("Find Best Match", function () {
        beforeEach(async function () {
            // Register workers and create jobs for testing
            await aiCanister.connect(owner).registerWorker(5, 3);
            await aiCanister.connect(addr1).registerWorker(2, 2);
            await aiCanister.connect(addr2).registerWorker(3, 4);
            await aiCanister.connect(owner).createJob(3, 3);
        });

        it("should find the best matching worker for a job", async function () {
            const bestWorker = await aiCanister.findBestMatch(0);
            expect(bestWorker).to.equal(addr2.address); // addr2 should be the best match
        });

        it("should revert if no suitable worker is found", async function () {
            // Create a job with impossible requirements
            await aiCanister.connect(owner).createJob(10, 10);
            await expect(aiCanister.findBestMatch(1))
                .to.be.revertedWith("No suitable worker found");
        });
    });

    describe("Get Worker Info", function () {
        it("should return worker info from WorkerInfo contract", async function () {
            const skillset = "Solidity Developer";
            await workerInfo.connect(owner).registerWorker(skillset);

            const workerDetails = await aiCanister.getWorkerInfo(owner.address);
            expect(workerDetails[0]).to.equal(owner.address);
            expect(workerDetails[1]).to.equal(skillset);
            expect(workerDetails[2]).to.be.true; // Assuming this is a boolean flag for active status
        });
    });

    describe("Get Job Details", function () {
        it("should return job details from MultiSigWalletFactory", async function () {
            const title = "Job Title";
            const description = "Job Description";
            const milestones = "Milestones";
            const payment = ethers.utils.parseEther("1.0");

            await factory.connect(owner).createJob(title, description, milestones, payment);
            const jobDetails = await aiCanister.getJobDetails(0);

            expect(jobDetails.title).to.equal(title);
            expect(jobDetails.description).to.equal(description);
            expect(jobDetails.milestones).to.equal(milestones);
            expect(jobDetails.payment).to.equal(payment);
        });
    });
});
