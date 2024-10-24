// hardhat.config.js
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
//require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
//require("@nomiclabs/hardhat-etherscan");

module.exports = {
    solidity: "0.4.25",  // Match the Solidity version used in your contracts
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
      networks: {
          hardhat: {
              chainId: 31337, // Default Hardhat local network
          },
          'base-sepolia': {
              url: `https://sepolia.base.org`,  // Replace with your Infura URL or Alchemy URL
              accounts: [``],  // Private key of the deployer (ensure it is stored safely)
          },
      },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
        customChains: [
          {
            network: "base-sepolia",
            chainId: 84532,
            urls: {
              apiURL: "https://base-sepolia.blockscout.com/api",
              browserURL: "https://base-sepolia.blockscout.com",
            },
          },
        ],
      }

};
