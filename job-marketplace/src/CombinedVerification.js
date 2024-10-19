import React, { useState } from 'react';
import Verification from './components/Verification';  // Face recognition component
import BiometricTest from './components/BiometricTest'; // Biometric authentication component

function CombinedVerification({ onLogin }) {
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);

  const handleFaceVerification = () => {
    setIsFaceVerified(true);
  };

  const handleBiometricVerification = () => {
    setIsBiometricVerified(true);
  };

  const handleFinalLogin = () => {
    if (isFaceVerified && isBiometricVerified) {
      onLogin();
    }
  };

  return (
    <div>
      {!isFaceVerified && (
        <div>
          <h2>Face Recognition Verification</h2>
          <Verification onVerified={handleFaceVerification} />
        </div>
      )}

      {isFaceVerified && !isBiometricVerified && (
        <div>
          <h2>Biometric Test</h2>
          <BiometricTest onVerified={handleBiometricVerification} />
        </div>
      )}

      {isFaceVerified && isBiometricVerified && (
        <button onClick={handleFinalLogin}>Complete Login</button>
      )}
    </div>
  );
}

export default CombinedVerification;
