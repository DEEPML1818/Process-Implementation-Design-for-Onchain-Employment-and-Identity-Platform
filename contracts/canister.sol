pragma solidity ^0.4.0;

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

    // Pretrained linear regression coefficients (off-chain model training)
    int constantTerm = 1;
    int experienceWeight = 2;
    int skillLevelWeight = 3;

    // Register a new worker
    function registerWorker(uint experience, uint skillLevel) public {
        require(!workers[msg.sender].exists, "Worker already exists");
        workers[msg.sender] = Worker({
            workerAddress: msg.sender,
            experience: experience,
            skillLevel: skillLevel,
            exists: true
        });
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

        for (address workerAddress : workerAddresses) {
            int score = predictWorkerScore(workerAddress, jobId);
            if (score > bestScore) {
                bestScore = score;
                bestWorker = workerAddress;
            }
        }

        require(bestWorker != address(0), "No suitable worker found");
        return bestWorker;
    }
}
