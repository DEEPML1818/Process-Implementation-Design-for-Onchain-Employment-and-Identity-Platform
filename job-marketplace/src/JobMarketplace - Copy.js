import { useState, useEffect } from "react";
import { ethers } from "ethers";
import multisigfactory from "./factory.json";
import Chat from './pages/Chat';  // Real-time chat component
import ChatHistory from './ChatHistory'; // Component for old chat history

function JobMarketplace({ wallet }) {
    const [jobs, setJobs] = useState([]);
    const [connectedContracts, setConnectedContracts] = useState([]);  // Track connected contracts

    useEffect(() => {
        async function fetchJobs() {
            const FACTORY_ABI = multisigfactory;
            const FACTORY_ADDRESS = "0xB3d9E2C3Ca370603398516608d9edFbbC0AC4a79";
            const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

            // Fetch total instantiations count
            const jobCount = await factoryContract.getInstantiationCount();

            let fetchedJobs = [];
            const limit = Math.min(jobCount, 1000);
            for (let i = 0; i < limit; i++) {
                try {
                    const jobAddress = await factoryContract.getInstantiation(i);
                    const jobDetails = await factoryContract.getJob(i);  // Fetch job details by ID
                    fetchedJobs.push({
                        contract: jobAddress,
                        title: jobDetails.title,
                        description: jobDetails.description,
                        milestones: jobDetails.milestones,
                        payment: ethers.utils.formatEther(jobDetails.payment),  // Format to ETH
                        employer: jobDetails.employer,
                        isActive: jobDetails.isActive,
                    });
                } catch (error) {
                    console.error(`Failed to fetch instantiation at index ${i}:`, error);
                }
            }
            setJobs(fetchedJobs);
        }

        fetchJobs();
    }, [wallet]);

    // Simulate job contract connection (replace with real connection logic)
    async function connectToJob(jobAddress) {
        setConnectedContracts([...connectedContracts, jobAddress]);
        alert(`Connected to job contract: ${jobAddress}`);
    }

    return (
        <div>
            <h2>Job Listings</h2>
            <ul>
                {jobs.map((job, index) => (
                    <li key={index}>
                        <p><strong>Job Title:</strong> {job.title}</p>
                        <p><strong>Description:</strong> {job.description}</p>
                        <p><strong>Milestones:</strong> {job.milestones}</p>
                        <p><strong>Payment:</strong> {job.payment} ETH</p>
                        <p><strong>Employer:</strong> {job.employer}</p>
                        <p><strong>Status:</strong> {job.isActive ? "Active" : "Inactive"}</p>
                        <p><strong>Job Contract:</strong> {job.contract}</p>
                        <button onClick={() => connectToJob(job.contract)}>Connect</button>

                        {/* Only show chat if connected */}
                        {connectedContracts.includes(job.contract) && <Chat jobAddress={job.contract} />}
                    </li>
                ))}
            </ul>
            {/* Page to view chat history */}
            <ChatHistory />
        </div>
    );
}

export default JobMarketplace;
