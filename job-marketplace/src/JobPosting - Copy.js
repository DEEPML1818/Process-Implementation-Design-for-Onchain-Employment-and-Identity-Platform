import { useState } from "react";
import { ethers } from "ethers";
import abimultisigfac from './Factory_multisig.json';
import { useNavigate } from 'react-router-dom';
import './job.css';  // Importing CSS file for styling

function JobPosting({ wallet, onJobPosted, readOnly }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestones, setMilestones] = useState("");
  const [payment, setPayment] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    const jobData = { title, description, milestones, payment };

    try {
      const FACTORY_ABI = abimultisigfac;
      const FACTORY_ADDRESS = "0xb079272C54a743624ECCf48d6D4761099104d075";  // Update with your factory contract address
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

      // Job-related parameters
      const owners = [await wallet.getAddress()]; // Example: the employer is the only owner
      const requiredConfirmations = 1; // Placeholder for required multisig confirmations

      // Convert payment to wei
      const paymentInWei = ethers.utils.parseEther(payment);

      // Call the createJob function
      const transaction = await factoryContract.createJob(owners, requiredConfirmations, title, description, milestones, paymentInWei);
      const receipt = await transaction.wait();

      // Notify parent component (JobListings) that a job has been posted
      onJobPosted();

      // Redirect to job listings after posting
      navigate('/job-listings');

      alert(`Job posted! Multisig Wallet Address: ${receipt.events[0].args.wallet}`);
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Error posting job. Please try again.");
    }
  }

  return (
    <><div>
      {readOnly ? (
        <p>You are in read-only mode. Please log in to post a job.</p>
      ) : (
        <form>{/* Form to post a job */}</form>
      )}
    </div><div className="container">
        <form onSubmit={handleSubmit}>
          <h2>Post a New Job</h2>
          <label>Job Title:</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          <label>Milestones:</label>
          <textarea value={milestones} onChange={(e) => setMilestones(e.target.value)} />
          <label>Payment (in ETH):</label>
          <input value={payment} onChange={(e) => setPayment(e.target.value)} />

          <button type="submit">Post Job</button>
        </form>
      </div></>
  );
}

export default JobPosting;
