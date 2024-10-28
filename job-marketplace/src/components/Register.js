import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { ethers } from 'ethers';
import Webcam from 'react-webcam';
import workerInfoABI from './WorkerInfo.json'; // Import your ABI
import './Home.css';

const Register = ({ onLogin }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skillset, setSkillset] = useState('');
  const webcamRef = useRef(null);

  const MODEL_URL = '/models';
  const WORKER_INFO_ADDRESS = "0x7f14CCD90b5200F275cdce3A20eB9eB722cb124F";

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading face recognition models...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log('Face recognition models loaded');
      } catch (err) {
        console.error('Error loading face recognition models:', err);
        setError('Error loading face recognition models');
      }
    };

    loadModels();
  }, []);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const walletAddress = accounts[0];
        setWalletAddress(walletAddress);
        console.log('Wallet connected:', walletAddress);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setError('Error connecting wallet');
      }
    } else {
      console.error('Ethereum wallet not detected');
      setError('Ethereum wallet not detected');
    }
  };

  const handleRegister = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet.');
      return;
    }

    if (!capturedImage) {
      setError('Please capture an image for face recognition.');
      return;
    }

    if (!skillset) {
      setError('Please enter your skillset.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageBlob = await fetch(capturedImage).then((res) => res.blob());
      const formData = new FormData();
      formData.append('walletAddress', walletAddress);
      formData.append('faceImage', imageBlob, 'capturedImage.jpg');

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.message) {
        await registerSkillset(skillset);
        setIsRegistered(true);
        setLoading(false);
        console.log('Registration successful');
        onLogin();
      } else {
        setError('Registration failed. Try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setError(error.message || 'An error occurred during registration.');
      setLoading(false);
    }
  };

  const registerSkillset = async (skillset) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const workerInfoContract = new ethers.Contract(WORKER_INFO_ADDRESS, workerInfoABI, signer);

    try {
      const tx = await workerInfoContract.registerWorker(skillset);
      await tx.wait();
      alert('Skillset successfully registered!');
    } catch (error) {
      console.error('Error registering skillset:', error);
      setError('Error registering skillset');
    }
  };

  return (
    <div className="container">
      <h2>Register (Sign-Up)</h2>

      <div className="wallet-connection">
        <h3>Step 1: Connect Wallet</h3>
        <button onClick={connectWallet}>
          {walletAddress ? `Wallet Connected: ${walletAddress}` : "Connect Wallet"}
        </button>
      </div>

      <div className="face-recognition">
        <h3>Step 2: Face Recognition</h3>
        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="webcam" />
        <button onClick={captureImage}>Capture Face</button>

        {capturedImage && <div className="captured-image"><img src={capturedImage} alt="Captured Face" /></div>}
      </div>

      <div className="skillset-input">
        <h3>Step 3: Enter Your Skillset</h3>
        <input type="text" value={skillset} onChange={(e) => setSkillset(e.target.value)} placeholder="Enter your skillset" />
      </div>

      <button className="register-btn" onClick={handleRegister} disabled={loading}>
        {loading ? 'Registering...' : 'Complete Registration'}
      </button>

      {error && <p className="error">{error}</p>}
      {isRegistered && <p className="success">Registration successful!</p>}
    </div>
  );
};

export default Register;
