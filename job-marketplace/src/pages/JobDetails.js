import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import abimultisigfac from './Factory_multisig.json';

function JobDetails({ wallet }) {
    const { jobId } = useParams();
    const [jobDetails, setJobDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [skillset, setSkillset] = useState('');
    const [resume, setResume] = useState('');
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (jobId) {
            fetchJobDetails(jobId);
        }
    }, [jobId]);

    async function fetchJobDetails(id) {
        try {
            const FACTORY_ABI = abimultisigfac;
            const FACTORY_ADDRESS = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B";
            const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
            const job = await factoryContract.getJob(id);
            setJobDetails(job);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching job details:", error);
            setLoading(false);
        }
    }

    async function applyForJob() {
        try {
            setApplying(true);
            const FACTORY_ABI = abimultisigfac;
            const FACTORY_ADDRESS = "0xb079272C54a743624ECCf48d6D4761099104d075";
            const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

            const tx = await factoryContract.applyForJob(jobId, skillset, resume);
            await tx.wait();
            alert('Successfully applied for the job!');
        } catch (error) {
            console.error("Error applying for job:", error);
            alert('Error applying for job.');
        } finally {
            setApplying(false);
        }
    }

    if (loading) {
        return <p>Loading job details...</p>;
    }

    return (
        <div>
            <h2>Job Details for Contract: {jobId}</h2>
            {jobDetails ? (
                <div>
                    <p><strong>Title:</strong> {jobDetails.title}</p>
                    <p><strong>Description:</strong> {jobDetails.description}</p>
                    <p><strong>Milestones:</strong> {jobDetails.milestones}</p>
                    <p><strong>Payment:</strong> {ethers.utils.formatEther(jobDetails.payment)} ETH</p>
                    <p><strong>Employer:</strong> {jobDetails.employer}</p>
                    <p><strong>Status:</strong> {jobDetails.isActive ? "Active" : "Inactive"}</p>

                    <h3>Apply for this job</h3>
                    <div>
                        <label>Skillset:</label>
                        <input
                            type="text"
                            value={skillset}
                            onChange={(e) => setSkillset(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Resume (URL or text):</label>
                        <input
                            type="text"
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                        />
                    </div>
                    <button onClick={applyForJob} disabled={applying}>
                        {applying ? "Applying..." : "Apply"}
                    </button>

                    <Link to={`/chat/${jobId}`}>
                        <button>Go to Chat</button>
                    </Link>
                </div>
            ) : (
                <p>No job details found.</p>
            )}
        </div>
    );
}

export default JobDetails;
