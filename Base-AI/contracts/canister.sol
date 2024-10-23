pragma solidity ^0.4.0;

import "./WorkerInfo.sol";  // Import WorkerInfo contract
import "./Factory_multisig.sol";   // Import MultiSigWalletFactory contract

contract AICanister {
    struct Worker {
        address workerAddress;
        uint experience;  // Numeric feature 1
        uint skillLevel;  // Numeric feature 2
        bool exists;
    }

    struct Job {
        uint requiredExperience;
        uint requiredSkillLevel;
        bool isActive;
    }

    mapping(address => Worker) public workers;
    Job[] public jobs;
    address[] public workerAddresses;  // Array to store worker addresses

    // Pretrained linear regression coefficients (off-chain model training)
    int constantTerm = 1;
    int experienceWeight = 2;
    int skillLevelWeight = 3;

    WorkerInfo_MetaTasker public workerInfo;  // Reference to WorkerInfo contract
    MultiSigWalletFactory public factory;       // Reference to MultiSigWalletFactory contract

    // Constructor
    constructor(address _workerInfoAddress, address _factoryAddress) public {
        workerInfo = WorkerInfo_MetaTasker(_workerInfoAddress);
        factory = MultiSigWalletFactory(_factoryAddress);
    }

    // Register a new worker
    function registerWorker(uint experience, uint skillLevel) public {
        require(!workers[msg.sender].exists, "Worker already exists");
        workers[msg.sender] = Worker({
            workerAddress: msg.sender,
            experience: experience,
            skillLevel: skillLevel,
            exists: true
        });
        workerAddresses.push(msg.sender);  // Store worker address in the array
    }

    // Create a new job
    function createJob(uint requiredExperience, uint requiredSkillLevel) public {
        jobs.push(Job({
            requiredExperience: requiredExperience,
            requiredSkillLevel: requiredSkillLevel,
            isActive: true
        }));
    }

    // Predict score for a worker based on Linear Regression
    function predictWorkerScore(address workerAddress, uint jobId) public view returns (int) {
        require(workers[workerAddress].exists, "Worker not found");
        require(jobs[jobId].isActive, "Job is not active");

        Worker memory worker = workers[workerAddress];
        Job memory job = jobs[jobId];

        // Linear regression prediction
        int prediction = constantTerm +
            experienceWeight * int(worker.experience) +
            skillLevelWeight * int(worker.skillLevel);

        return prediction;
    }

    // Find the best matching worker for a job
    function findBestMatch(uint jobId) public view returns (address) {
        require(jobs[jobId].isActive, "Job is not active");

        int bestScore = -100000;  // Start with a low score
        address bestWorker = address(0);

        // Iterate over the array of worker addresses
        for (uint i = 0; i < workerAddresses.length; i++) {
            address workerAddress = workerAddresses[i];
            int score = predictWorkerScore(workerAddress, jobId);
            if (score > bestScore) {
                bestScore = score;
                bestWorker = workerAddress;
            }
        }

        require(bestWorker != address(0), "No suitable worker found");
        return bestWorker;
    }

    // Get worker info from WorkerInfo contract
    function getWorkerInfo(address workerAddress) public view returns (address, string memory, bool) {
        return workerInfo.getWorker(workerAddress); // Fetch worker info from WorkerInfo contract
    }

    // Get job details from MultiSigWalletFactory
    function getJobDetails(uint jobId) public view returns (string memory title, string memory description, string memory milestones, uint payment) {
        (string memory jobTitle, string memory jobDescription, string memory jobMilestones, uint jobPayment) = factory.getJob(jobId);

        return (jobTitle, jobDescription, jobMilestones, jobPayment);
    }
}
