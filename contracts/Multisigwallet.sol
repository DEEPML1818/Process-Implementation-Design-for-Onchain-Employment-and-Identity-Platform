pragma solidity ^0.4.15;

import "./Security.sol";  // Import the Security contract

/// @title Multisignature wallet - Allows multiple parties to agree on transactions before execution.
/// @author Stefan George - <stefan.george@consensys.net>
contract MultiSigWallet {
     Security_MetaTasker public security;  // Reference to the Security contract

    

    /*
     *  Events
     */
    event Confirmation(address indexed sender, uint indexed transactionId);
    event Revocation(address indexed sender, uint indexed transactionId);
    event Submission(uint indexed transactionId);
    event Execution(uint indexed transactionId);
    event ExecutionFailure(uint indexed transactionId);
    event Deposit(address indexed sender, uint value);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint required);

 
    uint constant public MAX_OWNER_COUNT = 50;

    
    mapping (uint => Transaction) public transactions;
    mapping (uint => mapping (address => bool)) public confirmations;
    mapping (address => bool) public isOwner;
    address[] public owners;
    uint public required;
    uint public transactionCount;

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
    }

        struct Company {
        address id;
        string name;
        string description;
        string website;
        address owner;
        uint createdAt;
        bool paused;
    }

    struct Job {
    address employer;
    address worker;
    uint256 totalEscrowAmount;
    uint256 startTime;
    uint256 endTime;
    uint256[] milestoneAmounts;
    bool[] milestonesApproved;
    bool isActive;
    bool isCompleted;
}

mapping (uint256 => Job) public jobs;
uint256 public jobCount;




 struct Employee {
        address id;
        string name ;
        string email ;
        string employeeType;
        uint256 yearlyUSDSalary;
        uint256 totalReceivedUSD;
        uint256 totalDistributed;
        
    }


struct Payment {
        address to;
        address sourceToken;
        address targetToken;
        uint targetAmount;
        uint sourceAmount;
        uint minRate;
        uint maxRate;
    }

    mapping (uint256 => Company) private companyList ; 
   
    
    modifier onlyWallet() {
        require(msg.sender == address(this));
        _;
    }

    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner]);
        _;
    }

    modifier ownerExists(address owner) {
        require(isOwner[owner]);
        _;
    }

    modifier transactionExists(uint transactionId) {
        require(transactions[transactionId].destination != 0);
        _;
    }

    modifier onlyRegistered(uint256 _employeeID ) {
        require(exists(_employeeID),  "Employee Not Registered");
        _;
    }

    modifier confirmed(uint transactionId, address owner) {
        require(confirmations[transactionId][owner]);
        _;
    }

    modifier notConfirmed(uint transactionId, address owner) {
        require(!confirmations[transactionId][owner]);
        _;
    }

     modifier onlyPositive(uint256 _value) {
        require(_value > 0);
        _;
    }

     modifier onlyNotRegistered(uint256 _employeeID) {
        require(!exists(_employeeID) , "Employee Registered");
        _;
    }



    modifier notExecuted(uint transactionId) {
        require(!transactions[transactionId].executed);
        _;
    }

    modifier notNull(address _address) {
        require(_address != 0);
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(ownerCount <= MAX_OWNER_COUNT
            && _required <= ownerCount
            && _required != 0
            && ownerCount != 0);
        _;
    }

     // Modifier to ensure only authorized addresses can perform the action
    modifier onlyAuthorized() {
        require(security.isAuthorized(msg.sender), "Not authorized");
        _;
    }

    mapping(uint256 => Employee) public employeeList;
    uint256 private totalYearlyUSDSalary;
    uint256 public employeeCount = 0;

    function exists(uint256 _employeeID)
    internal
    view
    returns (bool)
    {
        return employeeList[_employeeID].id != address(0x0);
    }

    
    

    function MultiSigWallet(address[] _owners, uint _required)
        public
        validRequirement(_owners.length, _required)
    {
        for (uint i=0; i<_owners.length; i++) {
            require(!isOwner[_owners[i]] && _owners[i] != 0);
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }




    function addOwner(address owner)
        public
        onlyWallet
        ownerDoesNotExist(owner)
        notNull(owner)
        validRequirement(owners.length + 1, required)
    {
        isOwner[owner] = true;
        owners.push(owner);
        OwnerAddition(owner);
    }


    function removeOwner(address owner)
        public
        onlyWallet
        ownerExists(owner)
    {
        isOwner[owner] = false;
        for (uint i=0; i<owners.length - 1; i++)
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        owners.length -= 1;
        if (required > owners.length)
            changeRequirement(owners.length);
        OwnerRemoval(owner);
    }


   
    function replaceOwner(address owner, address newOwner)
        public
        onlyWallet
        ownerExists(owner)
        ownerDoesNotExist(newOwner)
    {
        for (uint i=0; i<owners.length; i++)
            if (owners[i] == owner) {
                owners[i] = newOwner;
                break;
            }
        isOwner[owner] = false;
        isOwner[newOwner] = true;
        OwnerRemoval(owner);
        OwnerAddition(newOwner);
    }

   
    function changeRequirement(uint _required)
        public
        onlyWallet
        validRequirement(owners.length, _required)
    {
        required = _required;
        RequirementChange(_required);
    }

     function createCompany(
        address _comapnyAddress, 
        string memory name , 
        string memory description , 
        string memory website ,
        uint256 company_id
        )
    public
    onlyWallet
    ownerExists(msg.sender)
    {
        require(company_id > 1 , "Only one company for one contract");
        Company storage c = companyList[company_id];
        c.id = _comapnyAddress ;
        c.name = name; 
        c.description = description ; 
        c.website = website ; 
        c.owner = msg.sender ; 
        c.createdAt = block.timestamp ; 
        c.paused = false ;  
    }

     /*  Adds an employee into the payroll if it is not already registered and has valid tokens and salary */
    function addEmployee(
        uint256 _employeeID, 
        address _employeeAddress, 
        string memory name , 
        string memory email , 
        string memory employeetype ,
        uint256 _initialYearlyUSDSalary)
    public
    onlyWallet
    ownerExists(msg.sender)
    onlyNotRegistered(_employeeID)
    onlyPositive(_initialYearlyUSDSalary)
    {
        employeeCount++;
        totalYearlyUSDSalary = totalYearlyUSDSalary + _initialYearlyUSDSalary;
       
       // employeesMap[_employeeAddress] = Employee(_employeeAddress, _initialYearlyEURSalary, 0, 0);

       Employee storage e = employeeList[_employeeID] ; 
       e.id = _employeeAddress ; 
       e.email = email ;
       e.name = name ; 
       e.employeeType = employeetype ; 
       e.yearlyUSDSalary = _initialYearlyUSDSalary ;
      

    }

    function removeEmployee(uint256 _employeeID)
    public
    onlyWallet
    ownerExists(msg.sender)
    onlyRegistered(_employeeID)
    {
        employeeCount = employeeCount - 1;
        totalYearlyUSDSalary = totalYearlyUSDSalary - employeeList[_employeeID].yearlyUSDSalary;
        delete employeeList[_employeeID];
       
       
    }

    mapping(uint256 => string) public jobDocuments;

    function storeJobDocument(uint256 jobId, string memory ipfsHash) 
        public 
        onlyWallet 
        ownerExists(msg.sender) 
    {
        require(jobs[jobId].isActive, "Job must be active to store documents");
        jobDocuments[jobId] = ipfsHash;
    }

    function completeJob(uint256 jobId) public onlyWallet {
    Job storage job = jobs[jobId];
    require(job.isActive, "Job is not active");
    require(job.employer == msg.sender || job.worker == msg.sender, "Only employer or worker can complete the job");

    // Ensure all milestones are approved
    for (uint256 i = 0; i < job.milestonesApproved.length; i++) {
        require(job.milestonesApproved[i], "All milestones must be approved");
    }

    job.isCompleted = true;
    job.isActive = false;
}



    function approveMilestone(uint256 jobId, uint256 milestoneIndex) 
    public 
    onlyWallet 
    ownerExists(msg.sender) 
{
    Job storage job = jobs[jobId];
    require(job.employer == msg.sender, "Only the employer can approve milestones");
    require(job.isActive, "Job is not active");
    require(!job.milestonesApproved[milestoneIndex], "Milestone already approved");

    job.milestonesApproved[milestoneIndex] = true;
    uint256 paymentAmount = job.milestoneAmounts[milestoneIndex];
    // Transfer the payment to the worker
    require(address(this).balance >= paymentAmount, "Insufficient funds in escrow");
    job.worker.transfer(paymentAmount);
}


    function applyToJob(uint _jobId, string memory _applicationCID) public {
        // Link worker's application to the job
    }



    function createJob(address _worker, uint256 _totalEscrowAmount, uint256[] _milestoneAmounts, uint256 _startTime, uint256 _endTime) 
    public 
    onlyWallet
    returns (uint256 jobId) 
{
    require(_worker != address(0), "Invalid worker address");
    require(_totalEscrowAmount > 0, "Escrow amount must be positive");
    require(_milestoneAmounts.length > 0, "There must be at least one milestone");

    jobId = jobCount++;
    Job storage job = jobs[jobId];
    job.employer = msg.sender;
    job.worker = _worker;
    job.totalEscrowAmount = _totalEscrowAmount;
    job.startTime = _startTime;
    job.endTime = _endTime;
    job.milestoneAmounts = _milestoneAmounts;
    job.milestonesApproved = new bool[](_milestoneAmounts.length);
    job.isActive = true;
}


    function checkCompanyDetails(uint256 _companyId) view
    external
     
     returns (string memory companyName ) 
    {
        return companyList[_companyId].name;
    }
    
    function submitTransaction(address _employeeID, uint Salary)
        public
        returns (uint transactionId)
    {

        transactionId = addTransaction(_employeeID, Salary, "0x");
        confirmTransaction(transactionId);
    }


    function confirmTransaction(uint transactionId)
        public
        ownerExists(msg.sender)
        transactionExists(transactionId)
        notConfirmed(transactionId, msg.sender)
    {
        confirmations[transactionId][msg.sender] = true;
        Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }


    function revokeConfirmation(uint transactionId)
        public
        ownerExists(msg.sender)
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = false;
        Revocation(msg.sender, transactionId);
    }

 
    function executeTransaction(uint transactionId)
        public
        ownerExists(msg.sender)
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
    {
        if (isConfirmed(transactionId)) {
            Transaction storage txn = transactions[transactionId];
            txn.executed = true;
            if (external_call(txn.destination, txn.value, txn.data.length, txn.data))
                Execution(transactionId);
            else {
                ExecutionFailure(transactionId);
                txn.executed = false;
            }
        }
    }

    function external_call(address destination, uint value, uint dataLength, bytes data) private returns (bool) {
        bool result;
        assembly {
            let x := mload(0x40)   // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
            let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
            result := call(
                sub(gas, 34710),   // 34710 is the value that solidity is currently emitting
                                   // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                                   // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
                destination,
                value,
                d,
                dataLength,        // Size of the input (in bytes) - this is what fixes the padding problem
                x,
                0                  // Output is ignored, therefore the output size is zero
            )
        }
        return result;
    }

   
    function isConfirmed(uint transactionId)
        public
        constant
        returns (bool)
    {
        uint count = 0;
        for (uint i=0; i<owners.length; i++) {
            if (confirmations[transactionId][owners[i]])
                count += 1;
            if (count == required)
                return true;
        }
    }

    
    function addTransaction(address destination, uint value, bytes data)
        internal
        notNull(destination)
        returns (uint transactionId)
    {
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            destination: destination,
            value: value,
            data: data,
            executed: false
        });
        transactionCount += 1;
        Submission(transactionId);
    }

   
    function getConfirmationCount(uint transactionId)
        public
        constant
        returns (uint count)
    {
        for (uint i=0; i<owners.length; i++)
            if (confirmations[transactionId][owners[i]])
                count += 1;
    }

    
    function getTransactionCount(bool pending, bool executed)
        public
        constant
        returns (uint count)
    {
        for (uint i=0; i<transactionCount; i++)
            if (   pending && !transactions[i].executed
                || executed && transactions[i].executed)
                count += 1;
    }

  
    function getOwners()
        public
        constant
        returns (address[])
    {
        return owners;
    }

    
    function getConfirmations(uint transactionId)
        public
        constant
        returns (address[] _confirmations)
    {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint count = 0;
        uint i;
        for (i=0; i<owners.length; i++)
            if (confirmations[transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count += 1;
            }
        _confirmations = new address[](count);
        for (i=0; i<count; i++)
            _confirmations[i] = confirmationsTemp[i];
    }

   
    function getTransactionIds(uint from, uint to, bool pending, bool executed)
        public
        constant
        returns (uint[] _transactionIds)
    {
        uint[] memory transactionIdsTemp = new uint[](transactionCount);
        uint count = 0;
        uint i;
        for (i=0; i<transactionCount; i++)
            if (   pending && !transactions[i].executed
                || executed && transactions[i].executed)
            {
                transactionIdsTemp[count] = i;
                count += 1;
            }
        _transactionIds = new uint[](to - from);
        for (i=from; i<to; i++)
            _transactionIds[i - from] = transactionIdsTemp[i];
    }
}
