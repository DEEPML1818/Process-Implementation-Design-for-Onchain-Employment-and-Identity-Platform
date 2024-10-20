// hardhat.config.js
require("@nomiclabs/hardhat-ethers");

module.exports = {
    solidity: "0.4.25",  // Match the Solidity version used in your contracts
    networks: {
        hardhat: {
            chainId: 31337, // Default Hardhat local network
        },
        basesepolia: {
            url: `https://sepolia.base.org`,  // Replace with your Infura URL or Alchemy URL
            accounts: [`c5a640429beb585a609e26cfa2f41e7091447ecb4e0a961c36e3d7a643ab1815`],  // Private key of the deployer (ensure it is stored safely)
        },
    },
    etherscan: {
        apiKey: "YOUR_ETHERSCAN_API_KEY"  // Optional, for contract verification
    }
};
