import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';

const FaceVerification = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(null);
  const [error, setError] = useState(null);
  const [referenceDescriptors, setReferenceDescriptors] = useState([]);
  const navigate = useNavigate(); // Hook for navigation after successful login

  const MODEL_URL = '/models'; 

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading models...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL) // Expression recognition

        setModelsLoaded(true);
        console.log('Models loaded successfully');
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Error loading models');
      }
    };
    loadModels();
  }, []);

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

  const captureAndVerify = async () => {
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
    </div>
  );
};

export default FaceVerification;
