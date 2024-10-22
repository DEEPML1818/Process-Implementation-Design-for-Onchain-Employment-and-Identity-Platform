// SPDX-License-Identifier: MIT
pragma solidity ^0.4.0;

contract Security_MetaTasker {
    address public owner;
    mapping(address => bool) public authorized;

    // Only the owner can authorize or revoke users
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;  // Set the creator of the contract as the owner
    }

    // Authorize a user
    function authorize(address _address) public onlyOwner {
        authorized[_address] = true;
    }

    // Revoke authorization of a user
    function revoke(address _address) public onlyOwner {
        authorized[_address] = false;
    }

    // Check if an address is authorized
    function isAuthorized(address _address) public view returns (bool) {
        return authorized[_address];
    }
}
