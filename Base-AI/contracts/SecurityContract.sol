// SPDX-License-Identifier: MIT
pragma solidity ^0.4.0;

contract SecurityContract {
    address[] public owners;
    uint256 public requiredApprovals;
    mapping(uint256 => mapping(address => bool)) public approvals;
    mapping(uint256 => bool) public executedActions;

    event ActionApproved(address owner, uint256 actionId);
    event ActionExecuted(uint256 actionId);

    modifier onlyOwner() {
        require(isOwner(msg.sender), "Not an owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _requiredApprovals) {
        require(_owners.length > 0, "Owners required");
        require(_requiredApprovals > 0 && _requiredApprovals <= _owners.length, "Invalid required approvals");

        owners = _owners;
        requiredApprovals = _requiredApprovals;
    }

    function isOwner(address _address) public view returns (bool) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _address) {
                return true;
            }
        }
        return false;
    }

    function approveAction(uint256 _actionId) public onlyOwner {
        require(!executedActions[_actionId], "Action already executed");
        require(!approvals[_actionId][msg.sender], "Already approved");

        approvals[_actionId][msg.sender] = true;
        emit ActionApproved(msg.sender, _actionId);

        if (getApprovalCount(_actionId) >= requiredApprovals) {
            executeAction(_actionId);
        }
    }

    function getApprovalCount(uint256 _actionId) public view returns (uint256 count) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (approvals[_actionId][owners[i]]) {
                count++;
            }
        }
    }

    function executeAction(uint256 _actionId) private {
        executedActions[_actionId] = true;
        emit ActionExecuted(_actionId);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }
}
