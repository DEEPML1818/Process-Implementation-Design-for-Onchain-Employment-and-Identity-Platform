const Web3 = require('web3').default; // Use .default if Web3 is not recognized
const multisigfactory = require("../Factory_multisig.json");

const RPC_URL = "https://sepolia.base.org"; // Replace with actual RPC URL

async function fetchJobs() {
  try {
    console.log("Initializing provider...");
    const FACTORY_ABI = multisigfactory;
    const FACTORY_ADDRESS = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B";
    
    // Initialize web3 directly with the provider URL
    const web3 = new Web3(RPC_URL);

    if (!web3) {
      console.error("Web3 provider initialization failed. Check RPC URL.");
      return;
    }
    console.log("Web3 provider initialized successfully.");

    const factoryContract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
    console.log("Factory contract instantiated at address:", FACTORY_ADDRESS);

    console.log("Fetching job count...");
    const jobCount = await factoryContract.methods.getInstantiationCount().call();
    const jobCountInt = parseInt(jobCount);
    console.log("Job Count:", jobCountInt);

    let fetchedJobs = [];

    for (let i = 1; i <= jobCountInt; i++) {
      try {
        console.log(`Fetching job details for job index ${i}...`);
        const jobDetails = await factoryContract.methods.getJob(i).call();
        console.log(`Raw job details for index ${i}:`, jobDetails);

        // Decode each field safely
        let title = jobDetails.title || "Invalid title data";
        let description = jobDetails.description || "Invalid description data";
        let milestones = jobDetails.milestones || "Invalid milestone data";
        let payment = web3.utils.fromWei(jobDetails.payment, 'ether') || "Invalid payment data";
        let employer = jobDetails.employer || "Invalid employer data";
        let multisigWallet = jobDetails.multisigWallet || "Invalid multisig wallet";
        let isActive = jobDetails.isActive ? "Active" : "Inactive";

        try {
          title = jobDetails.title || "Invalid title data";
        } catch (err) {
          console.error(`Error decoding title at index ${i}:`, err);
          title = "Invalid title data";
        }

        try {
          description = jobDetails.description || "Invalid description data";
        } catch (err) {
          console.error(`Error decoding description at index ${i}:`, err);
          description = "Invalid description data";
        }

        try {
          milestones = jobDetails.milestones || "Invalid milestone data";
        } catch (err) {
          console.error(`Error decoding milestones at index ${i}:`, err);
          milestones = "Invalid milestone data";
        }

        try {
          payment = web3.utils.fromWei(jobDetails.payment, 'ether');
        } catch (err) {
          console.error(`Error decoding payment at index ${i}:`, err);
          payment = "Invalid payment data";
        }

        fetchedJobs.push({
          title,
          description,
          milestones,
          payment,
        });

        console.log(`Job ${i} added:`, {
          title,
          description,
          milestones,
          payment,
        });

      } catch (error) {
        console.error(`Error fetching job at index ${i}:`, error);
      }
    }

    console.log("All jobs fetched:", fetchedJobs);
    return { jobs: fetchedJobs, contractCount: jobCountInt };

  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw new Error('Failed to fetch jobs');
  }
}

// Wrap the function call in an async IIFE to catch any errors
(async () => {
  try {
    console.log("Calling fetchJobs...");
    const result = await fetchJobs();
    console.log("Fetch Jobs Result:", result);
  } catch (error) {
    console.error("Fetch Jobs Error:", error);
  }
})();
