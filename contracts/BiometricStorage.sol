// SPDX-License-Identifier: MIT
pragma solidity ^0.4.0;

contract BiometricStorage_MetaTasker {
    struct User {
        address userAddress;
        string biometricHash;
    }

    mapping(address => User) public users;

    event UserRegistered(address indexed user, string biometricHash);

    // Register user with their biometric data hash
    function registerUser(string memory _biometricHash) public {
        users[msg.sender] = User({
            userAddress: msg.sender,
            biometricHash: _biometricHash
        });
        emit UserRegistered(msg.sender, _biometricHash);
    }

    // Verify the biometric hash matches
    function verifyUser(string memory _biometricHash) public view returns (bool) {
        return keccak256(abi.encodePacked(users[msg.sender].biometricHash)) == keccak256(abi.encodePacked(_biometricHash));
    }
}
