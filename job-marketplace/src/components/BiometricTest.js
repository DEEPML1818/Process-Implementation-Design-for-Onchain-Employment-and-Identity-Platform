import React, { useState } from 'react';
import { useWebAuthn } from '../utils/webAuthnUtils'; // A new helper for WebAuthn logic
import { registerUser, verifyUser } from '../utils/biometricUtils';

const BiometricTest = ({ walletAddress }) => {
  const [selectedImageFile, setSelectedImageFile] = useState(null); // State to store selected image file
  const [verificationResult, setVerificationResult] = useState(null);
  const { createCredential, getAssertion } = useWebAuthn();  // WebAuthn utilities for registration/verification

  const handleImageUpload = (event) => {
    const file = event.target.files[0]; // Get the selected file
    setSelectedImageFile(file); // Set the selected image file
  };

  const handleRegister = async () => {
    if (!selectedImageFile) {
      console.log('No image file selected');
      return;
    }

    const credential = await createCredential();
    
    const formData = new FormData();
    formData.append('faceImage', selectedImageFile); // Add the face image
    formData.append('walletAddress', walletAddress); // Add wallet address
    formData.append('credential', JSON.stringify(credential)); // Add WebAuthn credential
  
    // Post to server
    const response = await fetch('https://process-implementation-design-for-q3i5.onrender.com/upload', {
      method: 'POST',
      body: formData
    });
  
    const result = await response.json();
    console.log(result);
  };

  // Verify biometric data
  const handleVerify = async () => {
    try {
      const assertion = await getAssertion();
      if (assertion) {
        const isVerified = await verifyUser(assertion.id, walletAddress);
        setVerificationResult(isVerified ? 'Verified' : 'Not Verified');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationResult('Not Verified');
    }
  };

  return (
    <div>
      <h1>Biometric Test</h1>
      <input type="file" onChange={handleImageUpload} />
      {selectedImageFile && <p>File selected: {selectedImageFile.name}</p>}
      <button onClick={handleRegister}>Register Biometric Data</button>
      <button onClick={handleVerify}>Verify Biometric Data</button>
      {verificationResult && <p>Verification Result: {verificationResult}</p>}
    </div>
  );
};

export default BiometricTest;
