// MultiSigWalletFactory.sol

pragma solidity ^0.4.0;
pragma experimental ABIEncoderV2;

import "./Factory.sol";
import "./Multisigwallet.sol";
import "./Security.sol";
import "./WorkerInfo.sol"; // Correct import of the WorkerInfo contract

/// @title JobPosting with Multisignature wallet factory
contract MultiSigWalletFactory is Factory {
    Security_MetaTasker public security; // Reference the security contract
    WorkerInfo_MetaTasker public workerInfo; // Reference the worker information contract

    struct Job {
        string title;
        string description;
        string milestones;
        uint payment; // Payment in wei
        address employer;
        address multisigWallet;
        bool isActive;
    }

    struct Applicant {
        address applicantAddress;
        string skillset;
        string resume;
        bool isHired;
    }

    Job[] public jobs; // Array to store jobs
    mapping(address => uint[]) public employerJobs; // Maps employer address to job IDs
    mapping(uint => Applicant[]) public jobApplications; // Maps job ID to a list of applicants

    event JobCreated(uint indexed jobId, address indexed employer, address multisigWallet, string title);
    event AppliedForJob(uint indexed jobId, address indexed applicant, string skillset, string resume);

    // Constructor
    constructor(address _securityContract) Factory(_securityContract) {
        workerInfo = new WorkerInfo_MetaTasker(address(this)); // Pass this contract's address to WorkerInfo
    }

    // Modifier to ensure only authorized addresses can approve a transaction
    modifier onlyAuthorized() {
        require(security.isAuthorized(msg.sender), "Not authorized");
        _;
    }

    // Function to approve a multisig transaction, only accessible by authorized users
    function approveTransaction() public onlyAuthorized {
        // Your multisig logic here
    }

    // Create a job and multisig wallet
    function createJob(
        address[] memory _owners,
        uint _required,
        string memory _title,
        string memory _description,
        string memory _milestones,
        uint _payment
    ) public returns (address wallet, uint jobId) {
        wallet = new MultiSigWallet(_owners, _required); // Create multisig wallet
        register(wallet); // Register wallet in the factory

        // Create new job
        Job memory newJob = Job({
            title: _title,
            description: _description,
            milestones: _milestones,
            payment: _payment,
            employer: msg.sender,
            multisigWallet: wallet,
            isActive: true
        });
        jobs.push(newJob); // Add job to jobs array
        jobId = jobs.length - 1; // Job ID
        employerJobs[msg.sender].push(jobId); // Map employer to job

        emit JobCreated(jobId, msg.sender, wallet, _title); // Emit event for job creation
    }

    // Get job details by job ID
    function getJob(uint jobId) public view returns (Job memory) {
        require(jobId < jobs.length, "Job ID out of range");
        return jobs[jobId];
    }

    // Apply for a job
    function applyForJob(uint jobId, string memory _skillset, string memory _resume) public {
        require(jobId < jobs.length, "Job does not exist");

        // Add applicant to job
        Applicant memory applicant = Applicant({
            applicantAddress: msg.sender,
            skillset: _skillset,
            resume: _resume,
            isHired: false
        });
        jobApplications[jobId].push(applicant);

        emit AppliedForJob(jobId, msg.sender, _skillset, _resume); // Notify employer
    }

    // Get all applicants for a job
    function getApplicants(uint jobId) public view returns (Applicant[] memory) {
        require(jobId < jobs.length, "Job does not exist");
        return jobApplications[jobId];
    }

    // Function to register a worker
    function registerWorker(string memory _skillset) public {
        workerInfo.registerWorker(_skillset); // Only pass skillset
    }

    // Function to get worker info
    function getWorker(address _workerAddress) public view returns (address, string memory, bool) {
        return workerInfo.getWorker(_workerAddress); // Return the values directly
    }
}
