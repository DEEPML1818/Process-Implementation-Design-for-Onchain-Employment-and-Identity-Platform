import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import YOUR_WORKER_INFO_CONTRACT_ABI from './WorkerInfo.json';

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

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        setError('Error loading models');
      }
    };
    loadModels();
  }, []);

  const fetchImageFilenames = async () => {
    try {
      const response = await fetch(`${imageBaseUrl}/images`);
      if (!response.ok) throw new Error('Failed to fetch image filenames');
      return await response.json();
    } catch (err) {
      setError('Error fetching reference images');
      return [];
    }
  };

  useEffect(() => {
    const loadReferenceImages = async () => {
      const convertImageToDataUrl = async (imageUrl) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageUrl;
        
        await new Promise((resolve) => {
          image.onload = resolve;
        });
      
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return canvas.toDataURL();
      };
      

      const imageFilenames = await fetchImageFilenames();
      const descriptors = [];
    
      for (const filename of imageFilenames) {
        const imageUrl = `${filename}`;
        const dataUrl = await convertImageToDataUrl(imageUrl);
    
        const image = await faceapi.fetchImage(dataUrl);
    
        const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
        if (detection) {
          descriptors.push(detection.descriptor);
        } else {
          console.warn(`No face detected in ${filename}`);
        }
      }
    
      if (descriptors.length === 0) {
        setError('Error loading reference descriptors');
      } else {
        setReferenceDescriptors(descriptors);
      }
    };
    
  
    if (modelsLoaded) {
      loadReferenceImages();
    }
  }, [modelsLoaded]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const walletAddress = accounts[0];
      setWalletAddress(walletAddress);
    } else {
      setError('Ethereum wallet not detected');
    }
  };

  const isRegisteredInContract = async (address) => {
    if (!window.ethereum) {
      setError('Ethereum wallet not detected');
      return false;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      '0x7f14CCD90b5200F275cdce3A20eB9eB722cb124F',
      YOUR_WORKER_INFO_CONTRACT_ABI,
      provider
    );
    try {
      const workerData = await contract.getWorker(address);
      return workerData && workerData.someField !== null;
    } catch (err) {
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
            const threshold = 0.5;
            if (minDistance < threshold) {
              setIsVerified(true);
              setTimeout(() => {
                navigate('/dashboard');
              }, 1000);
            } else {
              setIsVerified(false);
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
