import React, { useEffect, useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { formatEther } from '@ethersproject/units';
import multisigfactory from "../Factory_multisig.json";

function JobListings({ wallet }) {
  const [jobs, setJobs] = useState([]);
  const [contractCount, setContractCount] = useState(0);

  const safeDecodeUtf8 = (field) => {
    try {
      return field && field.toString ? field.toString() : "";
    } catch (error) {
      console.warn("Failed to decode as UTF-8:", error);
      return "";
    }
  };
  
  useEffect(() => {
    async function fetchJobs() {
      try {
        if (!window.ethereum) {
          alert("Ethereum wallet not found. Please install MetaMask.");
          return;
        }

        const provider = new Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request accounts
        const signer = provider.getSigner();
        const FACTORY_ADDRESS = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B";
        const factoryContract = new Contract(FACTORY_ADDRESS, multisigfactory, signer);
        
        const jobCount = await factoryContract.getInstantiationCount();
        const jobCountNumber = parseInt(jobCount.toString());
        setContractCount(jobCountNumber);
        console.log("Total job count:", jobCountNumber);

        let fetchedJobs = [];
        for (let i = 1; i <= jobCountNumber; i++) {
          try {
            const jobDetails = await factoryContract.getJob(i);
            console.log(`Fetched job ${i} details:`, jobDetails);

            const job = {
              title: safeDecodeUtf8(jobDetails.title),
              description: safeDecodeUtf8(jobDetails.description),
              milestones: safeDecodeUtf8(jobDetails.milestones),
              payment: formatEther(jobDetails.payment),
            };

            fetchedJobs.push(job);
          } catch (error) {
            console.error(`Error fetching job at index ${i}:`, error);
          }
        }

        setJobs(fetchedJobs);
        console.log("Fetched all jobs:", fetchedJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        alert("Failed to fetch jobs. Please try again.");
      }
    }
    
    fetchJobs();
  }, [wallet]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Job Listings</h2>
      <p style={styles.contractCount}>Total Contracts: {contractCount}</p>
      <div style={styles.jobContainer}>
        {jobs.length > 0 ? (
          jobs.map((job, index) => (
            <div key={index} style={styles.jobBox}>
              <p><strong>Title:</strong> {job.title}</p>
              <p><strong>Description:</strong> {job.description}</p>
              <p><strong>Milestones:</strong> {job.milestones}</p>
              <p><strong>Payment:</strong> {job.payment} ETH</p>
            </div>
          ))
        ) : (
          <p>Loading jobs...</p>
        )}
      </div>
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
  },
  title: {
    fontSize: '1.6em',
    marginBottom: '20px',
    color: '#1f2937',
    textAlign: 'center',
  },
  contractCount: {
    fontSize: '1.2em',
    color: '#333',
    textAlign: 'center',
    marginBottom: '20px',
  },
  jobContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  jobBox: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default JobListings;
