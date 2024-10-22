pragma solidity ^0.4.15;

import "./Security.sol";  // Import the Security contract
contract Factory {
    Security_MetaTasker public security;  // Reference to the Security contract
   
    // Constructor takes the address of the Security contract
    constructor(address _securityContract) {
        security = Security_MetaTasker(_securityContract);  // Set the security contract
    }

        // Modifier to check if a user is authorized
    modifier onlyAuthorized() {
        require(security.isAuthorized(msg.sender), "Not authorized to interact with this contract");
        _;
    }

    
    /*
     *  Events
     */
    event ContractInstantiation(address sender, address instantiation);

    /*
     *  Storage
     */
    mapping(address => bool) public isInstantiation;
    address[] public allInstantiations; // Store all contract instantiations

    /*
     * Public functions
     */

    /// @dev Returns number of all instantiations.
    /// @return Returns the number of total instantiations.
    function getInstantiationCount()
        public
        view
        returns (uint)
    {
        return allInstantiations.length;
    }

    /// @dev Returns the address of an instantiation at a specific index.
    /// @param index The index of the instantiation to return.
    /// @return Returns the address of the instantiation.
    function getInstantiation(uint index)
        public
        view
        returns (address)
    {
        require(index < allInstantiations.length, "Index out of bounds");
        return allInstantiations[index];
    }

    /// @dev Returns all instantiations created so far.
    /// @return An array of addresses of all contract instantiations.
    function getAllInstantiations()
        public
        view
        returns (address[])
    {
        return allInstantiations;
    }

    /*
     * Internal functions
     */
    /// @dev Registers contract in factory registry.
    /// @param instantiation Address of contract instantiation.
    function register(address instantiation)
        internal
    {
        isInstantiation[instantiation] = true;
        allInstantiations.push(instantiation);
        ContractInstantiation(msg.sender, instantiation);
    }
}

contract Escrow {
    address public employer;
    address public employee;
    uint256 public totalAmount;
    uint256 public milestoneCount;
    uint256 public milestoneAmount;

    enum Status { Pending, Funded, Completed, Released }
    Status public contractStatus;

    constructor(address _employee, uint256 _totalAmount, uint256 _milestoneCount) {
        employer = msg.sender;
        employee = _employee;
        totalAmount = _totalAmount;
        milestoneCount = _milestoneCount;
        milestoneAmount = _totalAmount / _milestoneCount;
        contractStatus = Status.Pending;
    }

    modifier onlyEmployer() {
        require(msg.sender == employer, "Only employer can call this");
        _;
    }

    modifier onlyEmployee() {
        require(msg.sender == employee, "Only employee can call this");
        _;
    }

    function fundEscrow() external payable onlyEmployer {
        require(msg.value == totalAmount, "Incorrect amount");
        contractStatus = Status.Funded;
    }

    function releaseMilestone() external onlyEmployer {
    require(contractStatus == Status.Funded, "Contract is not funded");
    if (employee.send(milestoneAmount)) { // Send funds directly to address(employee)
        milestoneCount--;
        if (milestoneCount > 0) return; 
         contractStatus = Status.Released;
     }
    }

    function confirmCompletion() external onlyEmployee {
        contractStatus = Status.Completed;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}