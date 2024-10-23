pragma solidity ^0.4.15;

/// @title MultiSigWallet with Company and Employee Management
/// @notice A multi-signature wallet supporting multiple companies, workers, and managers, along with job management.
contract MultiSigWallet {

    /*
     * Events
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
    event CompanyCreated(uint256 indexed companyId, string name);
    event EmployeeAdded(uint256 indexed employeeId, string name);
    event ManagerAdded(address indexed manager);
    event ManagerRemoved(address indexed manager);
    
    uint constant public MAX_OWNER_COUNT = 50;

    mapping (uint => Transaction) public transactions;
    mapping (uint => mapping (address => bool)) public confirmations;
    mapping (address => bool) public isOwner;
    mapping (address => bool) public isManager;
    
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

    struct Employee {
        address id;
        string name;
        string email;
        string employeeType;
        uint256 yearlyUSDSalary;
        uint256 totalReceivedUSD;
        uint256 totalDistributed;
    }

    mapping(uint256 => Company) public companyList;
    mapping(uint256 => Employee) public employeeList;
    uint256 public companyCount;
    uint256 public employeeCount;
    
    uint256 private totalYearlyUSDSalary;

    modifier onlyWallet() {
        require(msg.sender == address(this), "Caller must be wallet contract");
        _;
    }

    modifier ownerExists(address owner) {
        require(isOwner[owner], "Owner does not exist");
        _;
    }

    modifier managerExists(address manager) {
        require(isManager[manager], "Manager does not exist");
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(ownerCount <= MAX_OWNER_COUNT
            && _required <= ownerCount
            && _required != 0
            && ownerCount != 0, "Invalid requirements");
        _;
    }

    function MultiSigWallet(address[] _owners, uint _required) 
        public 
        validRequirement(_owners.length, _required) 
    {
        for (uint i = 0; i < _owners.length; i++) {
            require(!isOwner[_owners[i]] && _owners[i] != address(0), "Invalid owner");
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }

    function addOwner(address owner) 
        public 
        onlyWallet 
        validRequirement(owners.length + 1, required) 
    {
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAddition(owner);
    }

    function removeOwner(address owner) 
        public 
        onlyWallet 
        ownerExists(owner) 
    {
        isOwner[owner] = false;
        for (uint i = 0; i < owners.length - 1; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        }
        owners.length--;
        if (required > owners.length)
            changeRequirement(owners.length);
        emit OwnerRemoval(owner);
    }

    function addManager(address manager) public onlyWallet {
        require(manager != address(0), "Invalid manager address");
        require(!isManager[manager], "Manager already exists");
        isManager[manager] = true;
        emit ManagerAdded(manager);
    }

    function removeManager(address manager) public onlyWallet managerExists(manager) {
        isManager[manager] = false;
        emit ManagerRemoved(manager);
    }

    function changeRequirement(uint _required) public onlyWallet validRequirement(owners.length, _required) {
        required = _required;
        emit RequirementChange(_required);
    }

    function createCompany(
        address _companyAddress, 
        string memory _name, 
        string memory _description, 
        string memory _website
    ) 
        public 
        onlyWallet 
    {
        companyCount++;
        Company storage c = companyList[companyCount];
        c.id = _companyAddress;
        c.name = _name;
        c.description = _description;
        c.website = _website;
        c.owner = msg.sender;
        c.createdAt = now;
        c.paused = false;

        emit CompanyCreated(companyCount, _name);
    }

    function addEmployee(
        uint256 _employeeID, 
        address _employeeAddress, 
        string memory _name, 
        string memory _email, 
        string memory _employeeType, 
        uint256 _yearlyUSDSalary
    ) 
        public 
        onlyWallet 
    {
        employeeCount++;
        totalYearlyUSDSalary += _yearlyUSDSalary;

        Employee storage e = employeeList[_employeeID];
        e.id = _employeeAddress;
        e.name = _name;
        e.email = _email;
        e.employeeType = _employeeType;
        e.yearlyUSDSalary = _yearlyUSDSalary;

        emit EmployeeAdded(_employeeID, _name);
    }

    function removeEmployee(uint256 _employeeID) public onlyWallet {
        totalYearlyUSDSalary -= employeeList[_employeeID].yearlyUSDSalary;
        delete employeeList[_employeeID];
        employeeCount--;
    }

    function submitTransaction(address destination, uint value, bytes data) 
        public 
        returns (uint transactionId) 
    {
        transactionId = addTransaction(destination, value, data);
        confirmTransaction(transactionId);
    }

    function addTransaction(address destination, uint value, bytes data) 
        internal 
        returns (uint transactionId) 
    {
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            destination: destination,
            value: value,
            data: data,
            executed: false
        });
        transactionCount++;
        emit Submission(transactionId);
    }

    function confirmTransaction(uint transactionId) 
        public 
        ownerExists(msg.sender) 
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }

    function executeTransaction(uint transactionId) 
        public 
        ownerExists(msg.sender) 
    {
        if (isConfirmed(transactionId)) {
            Transaction storage txn = transactions[transactionId];
            txn.executed = true;
            if (external_call(txn.destination, txn.value, txn.data.length, txn.data)) {
                emit Execution(transactionId);
            } else {
                emit ExecutionFailure(transactionId);
                txn.executed = false;
            }
        }
    }

    function external_call(address destination, uint value, uint dataLength, bytes data) 
        private 
        returns (bool) 
    {
        bool result;
        assembly {
            let x := mload(0x40)
            let d := add(data, 32)
            result := call(
                sub(gas, 34710),
                destination,
                value,
                d,
                dataLength,
                x,
                0
            )
        }
        return result;
    }

    function isConfirmed(uint transactionId) 
        public 
        view 
        returns (bool) 
    {
        uint count = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) count++;
            if (count == required) return true;
        }
        return false;
    }
}
