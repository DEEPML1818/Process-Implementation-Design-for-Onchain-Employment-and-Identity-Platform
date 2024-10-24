// BiometricVerification.js
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import CryptoJS from 'crypto-js';
import { uploadToIPFS } from '../utils/ipfsUpload'; // Helper function for IPFS

const BiometricVerification = ({ onVerified }) => {
  const videoRef = useRef();
  const [loading, setLoading] = useState(true);
  const [biometricHash, setBiometricHash] = useState(null);

  // Load the face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setLoading(false);
    };
    loadModels();
  }, []);

  // Start the video stream
  const startVideo = () => {
    navigator.getUserMedia(
      { video: {} },
      (stream) => (videoRef.current.srcObject = stream),
      (err) => console.error(err)
    );
  };

  useEffect(() => {
    startVideo();
  }, []);

  // Capture and process face data
  const handleCapture = async () => {
    const detections = await faceapi.detectAllFaces(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptors();

    if (detections.length > 0) {
      const faceDescriptor = detections[0].descriptor;
      const hash = CryptoJS.SHA256(JSON.stringify(faceDescriptor)).toString();
      setBiometricHash(hash);

      // Store on IPFS
      const ipfsHash = await uploadToIPFS(faceDescriptor);
      console.log("IPFS Hash:", ipfsHash);

      // Save hash on blockchain (e.g., smart contract interaction)
      // Add your logic here to save the hash on the blockchain

      onVerified(hash); // Call the parent component's callback
    } else {
      alert('No face detected, try again.');
    }
  };

  return (
    <div className="biometric-verification">
      {loading ? (
        <p>Loading face detection models...</p>
      ) : (
        <>
          <video ref={videoRef} autoPlay muted className="video-input" />
          <button onClick={handleCapture}>Capture Face Data</button>
          {biometricHash && <p>Biometric Hash: {biometricHash}</p>}
        </>
      )}
    </div>
  );
};

export default BiometricVerification;
