// WebAuthnComponent.js
import React, { useState } from 'react';
import { createCredential, getAssertion } from './webAuthnClientUtils';

function WebAuthnComponent() {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Function to register WebAuthn credential
  const handleRegister = async () => {
    try {
      const result = await createCredential(walletAddress);
      if (result.message) {
        console.log('Registration successful');
        setIsRegistered(true);
      } else {
        setError('Registration failed.');
      }
    } catch (err) {
      setError('Error during registration: ' + err.message);
    }
  };

  // Function to verify WebAuthn assertion
  const handleLogin = async () => {
    try {
      const result = await getAssertion('storedCredentialId');  // Use actual credential ID
      if (result.message) {
        console.log('Login successful');
      } else {
        setError('Login failed.');
      }
    } catch (err) {
      setError('Error during login: ' + err.message);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter wallet address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin} disabled={!isRegistered}>Login</button>
      {error && <p>{error}</p>}
    </div>
  );
}

export default WebAuthnComponent;
