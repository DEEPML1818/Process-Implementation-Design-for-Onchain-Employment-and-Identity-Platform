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
  const [walletAddress, setWalletAddress] = useState(null);
  const navigate = useNavigate();

  const MODEL_URL = '/models';
  const imageBaseUrl = 'http://localhost:5000';

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
  

  // Fetch image filenames from the server
  const fetchImageFilenames = async () => {
    try {
      const response = await fetch(`${imageBaseUrl}/images`);
      if (!response.ok) throw new Error('Failed to fetch image filenames');
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
        const imageUrl = `${filename}`;
        console.log('Loading image:', imageUrl);

        const image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.src = imageUrl;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
  
        const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
        if (detection) {
          descriptors.push(detection.descriptor);
          console.log(`Loaded descriptor for ${filename}`);
        } else {
          console.warn(`No face detected in ${filename}`);
        }
      }
  
      if (descriptors.length === 0) {
        console.error('No descriptors loaded.');
        setError('Error loading reference descriptors');
      } else {
        console.log('Descriptors loaded:', descriptors.length);
        setReferenceDescriptors(descriptors);
      }
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
      '0x7f14CCD90b5200F275cdce3A20eB9eB722cb124F',
      YOUR_WORKER_INFO_CONTRACT_ABI,
      provider
    );
    try {
      const workerData = await contract.getWorker(address);
      const isRegistered = workerData && workerData.someField !== null;
      return isRegistered;
    } catch (err) {
      console.error('Error checking registration:', err);
      setError('Error checking registration');
      return false;
    }
  };

  const captureAndVerify = async () => {
    if (!modelsLoaded) {
      setError('Please wait for models to load.');
      return;
    }
  
    if (referenceDescriptors.length === 0) {
      setError('Reference descriptors are not available.');
      return;
    }
  
    if (walletAddress && await isRegisteredInContract(walletAddress)) {
      if (webcamRef.current) {
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
        setError('Webcam not available.');
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

      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="640" height="480" />
      <button onClick={captureAndVerify}>Login with Face</button>
      <button onClick={connectWallet}>Connect Wallet</button>
    </div>
  );
};

export default FaceVerification;
