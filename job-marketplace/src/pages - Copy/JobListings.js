import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import multisigfactory from "../factory.json";
import '../job.css';  // Importing the CSS file for styling

function JobListings({ wallet }) {
  const [jobs, setJobs] = useState([]);

  // Fetch jobs when component mounts and when wallet changes
  useEffect(() => {
    async function fetchJobs() {
      try {
        const FACTORY_ABI = multisigfactory;
        const FACTORY_ADDRESS = "0xB3d9E2C3Ca370603398516608d9edFbbC0AC4a79";
    
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
    
        const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
                
        const jobCount = await factoryContract.getInstantiationCount();
        let fetchedJobs = [];
    
        for (let i = 0; i < Math.min(jobCount, 1000); i++) {
          const jobAddress = await factoryContract.getInstantiation(i);
          fetchedJobs.push({ contract: jobAddress });
        }
    
        setJobs(fetchedJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    }
    
    fetchJobs();
  }, [wallet]);

  return (
    <div className="container">
      <h2>Job Listings</h2>
      <ul>
        {jobs.map((job, index) => (
          <li key={index}>
            <Link to={`/job/${job.contract}`}>
              <p>Job Contract: {job.contract}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobListings;
