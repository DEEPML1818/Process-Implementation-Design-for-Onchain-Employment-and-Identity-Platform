import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';  
import YOUR_WORKER_INFO_CONTRACT_ABI from './WorkerInfo.json'; // Import your contract ABI

const FaceVerification = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(null);
  const [error, setError] = useState(null);
  const [referenceDescriptors, setReferenceDescriptors] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null); // State for wallet address
  const navigate = useNavigate();

  const MODEL_URL = '/models';
  const imageBaseUrl = 'https://process-implementation-design-for-q3i5.onrender.com'; // Base URL for images

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading models...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        setModelsLoaded(true);
        console.log('Models loaded successfully');
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Error loading models');
      }
    };
    loadModels();
  }, []);

  // Fetch the image filenames from the server
  const fetchImageFilenames = async () => {
    try {
      const response = await fetch(`${imageBaseUrl}/images`);
      if (!response.ok) {
        throw new Error('Failed to fetch image filenames');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching image filenames:', err);
      setError('Error fetching reference images');
      return [];
    }
  };

  // Load reference images and their face descriptors
  useEffect(() => {
    const loadReferenceImages = async () => {
      const imageFilenames = await fetchImageFilenames();
      const descriptors = [];

      for (const filename of imageFilenames) {
        const imageUrl = `${imageBaseUrl}/${filename}`;
        const image = new Image();
        image.src = imageUrl;

        image.onload = async () => {
          const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
          if (detection) {
            descriptors.push(detection.descriptor);
          }
        };
      }

      setReferenceDescriptors(descriptors);
    };

    if (modelsLoaded) {
      loadReferenceImages();
    }
  }, [modelsLoaded]);

  // Connect to the Ethereum wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const walletAddress = accounts[0];
      setWalletAddress(walletAddress);
      console.log('Wallet connected:', walletAddress);
    } else {
      console.error('Ethereum wallet not detected');
      setError('Ethereum wallet not detected');
    }
  };

  // Check if the wallet address is registered in the worker info contract
  const isRegisteredInContract = async (address) => {
    if (!window.ethereum) {
      setError('Ethereum wallet not detected');
      return false;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(
      '0x7f14CCD90b5200F275cdce3A20eB9eB722cb124F', // Replace with your contract address
      YOUR_WORKER_INFO_CONTRACT_ABI,
      provider
    );

    try {
      const isRegistered = await contract.isRegistered(address); // Replace with the actual method name from your contract
      return isRegistered;
    } catch (err) {
      console.error('Error checking registration:', err);
      setError('Error checking registration');
      return false;
    }
  };

  // Capture image from webcam and verify against reference descriptors
  const captureAndVerify = async () => {
    if (walletAddress && await isRegisteredInContract(walletAddress)) {
      if (webcamRef.current && modelsLoaded && referenceDescriptors.length > 0) {
        const capturedImage = webcamRef.current.getScreenshot();
        const img = new Image();
        img.src = capturedImage;

        img.onload = async () => {
          const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
          if (detection) {
            const distances = referenceDescriptors.map(descriptor =>
              faceapi.euclideanDistance(detection.descriptor, descriptor)
            );
            const minDistance = Math.min(...distances);
            const threshold = 0.5; // Set threshold for face similarity
            if (minDistance < threshold) {
              setIsVerified(true);
              console.log('Face verified successfully!');
              setTimeout(() => {
                navigate('/dashboard'); // Navigate to dashboard after successful verification
              }, 1000);
            } else {
              setIsVerified(false);
              console.log('Face verification failed.');
            }
          }
        };
      } else {
        setError('Please ensure models are loaded and descriptors are available.');
      }
    } else {
      setError('Your wallet address is not registered. Please register first.');
    }
  };

  return (
    <div>
      <h1>Login with Face Verification</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isVerified === true ? (
        <p style={{ color: 'green' }}>Login successful! Redirecting...</p>
      ) : isVerified === false ? (
        <p style={{ color: 'red' }}>Face not recognized. Please try again.</p>
      ) : (
        <p>Please capture your face for verification.</p>
      )}

      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width="640"
        height="480"
      />
      <button onClick={captureAndVerify}>Login with Face</button>
      <button onClick={connectWallet}>Connect Wallet</button> {/* Button to connect wallet */}
    </div>
  );
};

export default FaceVerification;
