import React, { useState } from 'react';
import { createCredential, getAssertion, registerWebAuthnCredential, verifyWebAuthnAssertion } from '../utils/webAuthnUtils';

const BiometricTest = ({ walletAddress }) => {
  const [verificationResult, setVerificationResult] = useState(null);

  // Handle biometric registration
  const handleRegister = async () => {
    try {
      // Create WebAuthn credential (using fingerprint)
      const credential = await createCredential(walletAddress);
      
      // Register credential on the server or chain (store on-chain or in a database)
      await registerWebAuthnCredential(credential, walletAddress);
      
      console.log('Biometric data registered successfully');
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  // Handle biometric verification (fingerprint)
  const handleVerify = async () => {
    try {
      // Get WebAuthn assertion for biometric verification (fingerprint)
      const assertion = await getAssertion();
      
      // Verify assertion on the server or chain (verify on-chain)
      const isVerified = await verifyWebAuthnAssertion(assertion, walletAddress);
      
      setVerificationResult(isVerified ? 'Verified' : 'Not Verified');
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
