import React, { useEffect, useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import multisigfactory from '../Factory_multisig.json';

function JobApplications() {
  const [jobApplications, setJobApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobApplications() {
      try {
        if (!window.ethereum) {
          alert("Ethereum wallet not found. Please install MetaMask.");
          return;
        }

        const provider = new Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        const FACTORY_ADDRESS = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B";
        const factoryContract = new Contract(FACTORY_ADDRESS, multisigfactory, signer);

        const jobCount = await factoryContract.getInstantiationCount();
        const jobCountNumber = parseInt(jobCount.toString());
        
        let allApplications = [];
        for (let i = 1; i <= jobCountNumber; i++) {
          try {
            const jobDetails = await factoryContract.getJob(i);
            const applicants = await factoryContract.getApplicants(i);
            
            const jobApplications = applicants.map((applicant) => ({
              jobId: i,
              title: jobDetails.title,
              employer: jobDetails.employer,
              applicantAddress: applicant.applicantAddress,
              skillset: applicant.skillset,
              resume: applicant.resume,
              isHired: applicant.isHired,
            }));
            console.log(jobApplications)
            allApplications = [...allApplications, ...jobApplications];
          } catch (error) {
            console.error(`Error fetching applicants for job ${i}:`, error);
          }
        }

        setJobApplications(allApplications);
      } catch (error) {
        console.error("Error fetching job applications:", error);
        alert("Failed to fetch job applications. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchJobApplications();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Job Applications</h2>
      {loading ? (
        <p>Loading job applications...</p>
      ) : jobApplications.length > 0 ? (
        <div style={styles.applicationContainer}>
          {jobApplications.map((app, index) => (
            <div key={index} style={styles.applicationBox}>
              <p><strong>Job ID:</strong> {app.jobId}</p>
              <p><strong>Title:</strong> {app.title}</p>
              <p><strong>Employer:</strong> {app.employer}</p>
              <p><strong>Applicant Wallet:</strong> {app.applicantAddress}</p>
              <p><strong>Skillset:</strong> {app.skillset}</p>
              <p><strong>Resume:</strong> {app.resume}</p>
              <p><strong>Hired Status:</strong> {app.isHired ? "Yes" : "No"}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No applications found.</p>
      )}
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
  applicationContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  applicationBox: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default JobApplications;
