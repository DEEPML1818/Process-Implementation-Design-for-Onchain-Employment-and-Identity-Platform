import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { ethers } from 'ethers';
import Webcam from 'react-webcam';
import './Home.css';

const Register = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef(null);

  const MODEL_URL = '/models'; // Replace with the correct model path

  // Load face-api models
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

  // Capture image from webcam
  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  // Wallet connect logic
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

  // Register user by pairing face image with wallet address
  const handleRegister = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet.');
      return;
    }

    if (!capturedImage) {
      setError('Please capture an image for face recognition.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageBlob = await fetch(capturedImage).then((res) => res.blob());

      const formData = new FormData();
      formData.append('walletAddress', walletAddress);
      formData.append('faceImage', imageBlob, 'capturedImage.jpg');

      // Simulate registration request
      // Replace the below line with your backend endpoint for registering users
      console.log('Registering user with wallet address:', walletAddress);
      setTimeout(() => {
        setIsRegistered(true);
        setLoading(false);
        console.log('Registration successful');
      }, 1500);
    } catch (error) {
      console.error('Error during registration:', error);
      setError('Error during registration');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Register with Wallet & Face Recognition</h1>

      {walletAddress ? (
        <p>Connected Wallet Address: {walletAddress}</p>
      ) : (
        <button onClick={connectWallet} className="wallet-btn">
          Connect Wallet
        </button>
      )}

      <div className="webcam-container">
        {modelsLoaded ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam"
          />
        ) : (
          <p>Loading face recognition models...</p>
        )}
        <button onClick={captureImage} className="capture-btn" disabled={!modelsLoaded}>
          Capture Face
        </button>
      </div>

      {capturedImage && (
        <div className="captured-image">
          <h3>Captured Image</h3>
          <img src={capturedImage} alt="Captured" />
        </div>
      )}

      {loading && <p>Registering...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isRegistered ? (
        <p style={{ color: 'green' }}>Registration successful!</p>
      ) : (
        <button onClick={handleRegister} className="register-btn" disabled={loading || !capturedImage || !walletAddress}>
          Register
        </button>
      )}
    </div>
  );
};

export default Register;
