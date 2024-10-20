// BiometricTest.js
import React, { useState } from 'react';
import { useWebAuthn } from '../utils/webAuthnUtils'; // A new helper for WebAuthn logic
import { registerUser, verifyUser } from '../utils/biometricUtils';

const BiometricTest = ({ walletAddress }) => {
  const [biometricData, setBiometricData] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const { createCredential, getAssertion } = useWebAuthn();  // WebAuthn utilities for registration/verification

  const handleRegister = async () => {
    const faceImage = selectedImageFile;  // Image file selected from the user
    const credential = await createCredential();
    
    const formData = new FormData();
    formData.append('faceImage', faceImage); // Add the face image
    formData.append('walletAddress', walletAddress); // Add wallet address
    formData.append('credential', JSON.stringify(credential)); // Add WebAuthn credential
  
    // Post to server
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    });
  
    const result = await response.json();
    console.log(result);
  }

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
      <button onClick={handleRegister}>Register Biometric Data</button>
      <button onClick={handleVerify}>Verify Biometric Data</button>
      {verificationResult && <p>Verification Result: {verificationResult}</p>}
    </div>
  );
};

export default BiometricTest;