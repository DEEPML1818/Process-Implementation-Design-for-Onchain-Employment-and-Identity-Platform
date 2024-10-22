// WorkerInfo_MetaTasker.sol

pragma solidity ^0.4.0;

import "./Factory_multisig.sol"; // Import your existing multisig wallet factory contract

contract WorkerInfo_MetaTasker {
    struct Worker {
        address walletAddress;
        string skillset;
        bool exists; // Flag to check if worker exists
    }

    mapping(address => Worker) public workers; // Mapping to store workers by wallet address
    MultiSigWalletFactory public factory; // Reference to the multisig wallet factory

    // Event to notify when a worker is registered
    event WorkerRegistered(address indexed walletAddress, string skillset);

    // Constructor
    constructor(address _factoryAddress) public {
        factory = MultiSigWalletFactory(_factoryAddress); // Set reference to the factory contract
    }

    // Register a worker
    function registerWorker(string memory _skillset) public {
        require(!workers[msg.sender].exists, "Worker already registered");

        workers[msg.sender] = Worker({
            walletAddress: msg.sender,
            skillset: _skillset,
            exists: true
        });

        emit WorkerRegistered(msg.sender, _skillset); // Emit event
    }

    // Get worker information
    function getWorker(address _workerAddress) public view returns (address, string memory, bool) {
        require(workers[_workerAddress].exists, "Worker not found");
        Worker storage worker = workers[_workerAddress];
        return (worker.walletAddress, worker.skillset, worker.exists);
    }

    // Example function to demonstrate communication with the factory
    function createJobForWorker(
        address[] memory _owners,
        uint _required,
        string memory _title,
        string memory _description,
        string memory _milestones,
        uint _payment
    ) public {
        require(workers[msg.sender].exists, "Only registered workers can create jobs");

        // Call createJob function from the factory contract
        factory.createJob(_owners, _required, _title, _description, _milestones, _payment);
    }
}
