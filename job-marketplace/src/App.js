import React, { useState, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import Navbar from './Navbar';
import './App.css';

// Lazy loaded components
const JobListings = lazy(() => import('./pages/JobListings'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const Chat = lazy(() => import('./pages/Chat'));
const Register = lazy(() => import('./components/Register'));
const Verification = lazy(() => import('./components/Verification'));
const PreviousChats = lazy(() => import('./pages/PreviousChats'));
const Home = lazy(() => import('./pages/Home'));
const JobPosting = lazy(() => import('./JobPosting'));
const BiometricTest = lazy(() => import('./components/BiometricTest'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState(null);
  const [providerType, setProviderType] = useState(null); // Added to track Coinbase or MetaMask

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Function to connect to MetaMask wallet
  async function connectMetaMask() {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []); // Prompt user to connect their wallet
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        setWallet(signer);
        setAddress(userAddress);
        setProviderType('MetaMask');
        setIsAuthenticated(true);  // Mark user as authenticated after wallet connection
      } catch (error) {
        console.error('MetaMask connection failed:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  }

  // Function to connect to Coinbase Wallet
  async function connectCoinbase() {
    try {
      const APP_NAME = 'Web3 Job Marketplace';
      const APP_LOGO_URL = 'https://example.com/logo.png';  // Add your app's logo here
      const DEFAULT_ETH_JSONRPC_URL = 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'; // Replace with your RPC URL
      const DEFAULT_CHAIN_ID = 1; // Ethereum mainnet

      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: APP_NAME,
        appLogoUrl: APP_LOGO_URL,
        darkMode: false
      });

      const ethereum = coinbaseWallet.makeWeb3Provider(DEFAULT_ETH_JSONRPC_URL, DEFAULT_CHAIN_ID);
      const provider = new ethers.providers.Web3Provider(ethereum);
      
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      setWallet(signer);
      setAddress(userAddress);
      setProviderType('Coinbase');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Coinbase connection failed:', error);
    }
  }

  useEffect(() => {
    // Auto-connect wallet if already connected (MetaMask or Coinbase)
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectMetaMask();
    }
  }, []);

  const renderWithRestriction = (Component, props) => {
    return isAuthenticated ? (
      <Component {...props} wallet={wallet} address={address} providerType={providerType} />
    ) : (
      <div className="read-only-overlay">
        <p className="overlay-message">
          You are viewing the site in read-only mode. Please log in or sign up to interact.
        </p>
        <Component {...props} readOnly />
      </div>
    );
  };

  return (
    <Router>
      <Navbar 
        wallet={wallet} 
        address={address} 
        connectMetaMask={connectMetaMask} 
        connectCoinbase={connectCoinbase} 
        providerType={providerType}
      />
      <div className="app-container">
        <h1>Web3 Job Marketplace</h1>

        {/* Lazy loading with suspense */}
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Main Landing Page */}
            <Route path="/" element={<Home />} />

            {/* Registration page */}
            <Route path="/register" element={<Register onLogin={handleLogin} />} />

            {/* Verification (Login) page */}
            <Route path="/verify" element={<Verification onLogin={handleLogin} />} />

            {/* Biometric Test page */}
            <Route path="/biometric-test" element={<BiometricTest />} />

            {/* Job posting page */}
            <Route
              path="/post-job"
              element={renderWithRestriction(JobPosting, { wallet, onJobPosted: () => {} })}
            />

            {/* Job Listings page */}
            <Route
              path="/job-listings"
              element={renderWithRestriction(JobListings, { wallet })}
            />

            {/* Job details, chat, and previous chats */}
            <Route path="/job/:jobId" element={renderWithRestriction(JobDetails)} />
            <Route path="/chat/:jobId" element={renderWithRestriction(Chat)} />
            <Route path="/previous-chats" element={renderWithRestriction(PreviousChats)} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
