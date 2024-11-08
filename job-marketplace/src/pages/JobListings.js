import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import multisigfactory from "../factory.json";

function JobListings({ wallet }) {
  const [jobs, setJobs] = useState([]);

  // Fetch jobs when component mounts and when wallet changes
  useEffect(() => {
    async function fetchJobs() {
      try {
        const FACTORY_ABI = multisigfactory;
        const FACTORY_ADDRESS = "0xB3d9E2C3Ca370603398516608d9edFbbC0AC4a79";
    
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Prompt for wallet connection
        const signer = provider.getSigner();
    
        const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
    
        // Ensure the method exists before calling it
        if (!factoryContract.getInstantiationCount) {
          console.error("Contract does not have the getInstantiationCount function.");
          return;
        }
  
        const jobCount = await factoryContract.getInstantiationCount();
        console.log('Job Count:', jobCount.toString());
  
        let fetchedJobs = [];
        for (let i = 0; i < Math.min(jobCount.toNumber(), 1000); i++) {
          const jobAddress = await factoryContract.getInstantiation(i);
          fetchedJobs.push({ contract: jobAddress });
        }
    
        setJobs(fetchedJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        if (error.reason) {
          console.log('Revert reason:', error.reason);
        }
        alert('Failed to fetch jobs. Please try again.');
      }
    }
  
    fetchJobs();
  }, [wallet]);
  

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Job Listings</h2>
      <ul style={styles.jobList}>
        {jobs.map((job, index) => (
          <li key={index} style={styles.jobItem}>
            <Link to={`/job/${job.contract}`} style={styles.jobLink}>
              <p style={styles.jobText}>Job Contract: {job.contract}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    marginBottom: '40px',
  },
  title: {
    fontSize: '1.6em',
    marginBottom: '20px',
    color: '#1f2937',
    textAlign: 'center',
  },
  jobList: {
    listStyleType: 'none',
    padding: 0,
  },
  jobItem: {
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  jobLink: {
    textDecoration: 'none',
    color: '#1f2937',
  },
  jobText: {
    fontSize: '1.1em',
    color: '#333',
  },
  jobItemHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 10px rgba(0, 0, 0, 0.2)',
  },
};

// Apply hover styles dynamically
styles.jobItem[':hover'] = styles.jobItemHover;

export default JobListings;
