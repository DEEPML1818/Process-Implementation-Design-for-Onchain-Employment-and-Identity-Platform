import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { ethers } from 'ethers';
import { verifyWebAuthnAssertion } from '../utils/webAuthnUtils'; // Import WebAuthn utility
import { useNavigate } from 'react-router-dom'; // For navigation

const MODEL_URL = '/models'; // Path to the face-api models

const Login = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [referenceDescriptors, setReferenceDescriptors] = useState([]);
  const [isFaceVerified, setIsFaceVerified] = useState(null);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

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

  // Load reference images and descriptors (for face comparison)
  useEffect(() => {
    const importAll = (r) => {
      let images = [];
      r.keys().map((item) => images.push(r(item)));
      return images;
    };

    const images = importAll(require.context('../Job-marketplace-backend/uploads', false, /\.(jpg|jpeg|png|gif)$/));
    
    const loadReferenceImages = async () => {
      const descriptors = [];
      for (const img of images) {
        const image = new Image();
        image.src = img;

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

  // Connect Wallet
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

  // Login with WebAuthn (Fingerprint)
  const handleWebAuthnLogin = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet.');
      return;
    }

    try {
      const verified = await verifyWebAuthnAssertion(walletAddress);
      if (verified) {
        console.log('Fingerprint verified successfully!');
        handleFaceVerification(); // Proceed to face verification after fingerprint success
      } else {
        setIsVerified(false);
        console.log('Fingerprint verification failed.');
      }
    } catch (error) {
      console.error('Error during WebAuthn login:', error);
      setError('Failed to login with WebAuthn');
    }
  };

  // Capture face image and verify against reference images
  const handleFaceVerification = async () => {
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
            setIsFaceVerified(true);
            console.log('Face verified successfully!');
            setTimeout(() => {
              navigate('/dashboard'); // Navigate to dashboard after successful verification
            }, 1000);
          } else {
            setIsFaceVerified(false);
            console.log('Face verification failed.');
          }
        }
      };
    } else {
      setError('Please ensure models are loaded and face descriptors are available.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <button onClick={connectWallet}>
        {walletAddress ? `Wallet Connected: ${walletAddress}` : "Connect Wallet"}
      </button>

      <h3>Step 1: Fingerprint (WebAuthn) Verification</h3>
      <button onClick={handleWebAuthnLogin}>
        {isVerified ? "Fingerprint Verified" : "Login with Fingerprint"}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Step 2: Face Verification</h3>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width="640"
        height="480"
      />
      <button onClick={handleFaceVerification}>
        {isFaceVerified ? "Face Verified" : "Login with Face"}
      </button>

      {isFaceVerified === true && <p style={{ color: 'green' }}>Face verified successfully! Redirecting...</p>}
      {isFaceVerified === false && <p style={{ color: 'red' }}>Face verification failed. Try again.</p>}
    </div>
  );
};

export default Login;
