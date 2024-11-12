import { useState } from "react";
import { Web3Provider } from "@ethersproject/providers"; // Import Web3Provider separately
import { parseEther } from "@ethersproject/units"; // Import parseEther separately
import { Contract } from "@ethersproject/contracts"; // Import Contract separately
import abimultisigfac from './Factory_multisig.json';
import { useNavigate } from 'react-router-dom';

function JobPosting({ wallet, onJobPosted, readOnly }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestones, setMilestones] = useState("");
  const [payment, setPayment] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const FACTORY_ADDRESS = "0xb923DcE82100aBF8181354e9572ed6C61De8C52B";
      const provider = new Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const factoryContract = new Contract(FACTORY_ADDRESS, abimultisigfac, signer);

      const ownerAddress = await signer.getAddress();
      const requiredConfirmations = 1;
      const paymentInWei = parseEther(payment);

      const transaction = await factoryContract.createJob(
        [ownerAddress],
        requiredConfirmations,
        title,
        description,
        milestones,
        paymentInWei
      );

      const receipt = await transaction.wait();

      onJobPosted();
      navigate('/job-listings');
      alert(`Job posted! Multisig Wallet Address: ${receipt.events[0].args.wallet}`);
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Error posting job. Please try again.");
    }
  }

  return (
    <>
      <div>
        {readOnly ? (
          <p>You are in read-only mode. Please log in to post a job.</p>
        ) : (
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
        )}
      </div>
    </>
  );
}

export default JobPosting;
