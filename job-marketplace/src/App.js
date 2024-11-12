import React, { useState, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BrowserProvider } from 'ethers'; // Correct import for ethers@6
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
const JobApplications = lazy(() => import('./pages/JobApplications')); // Import JobApplications

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState(null);
  const [providerType, setProviderType] = useState(null); // Track Coinbase or MetaMask

  const TARGET_CHAIN_ID = 84532; // Base Testnet
  const NETWORK_PARAMS = {
    chainId: '0x14a34', // Hexadecimal for 84532
    chainName: 'Base Testnet',
    nativeCurrency: { name: 'Base', symbol: 'BASE', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'], // Update as needed
    blockExplorerUrls: ['https://base-explorer.com'], // Update as needed
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  async function switchNetwork(provider) {
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NETWORK_PARAMS.chainId }] });
    } catch (error) {
      if (error.code === 4902) {
        // If the chain is not added, request to add it
        await provider.request({ method: 'wallet_addEthereumChain', params: [NETWORK_PARAMS] });
      } else {
        console.error('Network switch failed:', error);
      }
    }
  }

  // Function to connect to MetaMask wallet
  async function connectMetaMask() {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);  // Use BrowserProvider for ethers@6
        await window.ethereum.request({ method: 'eth_requestAccounts' }); // Prompt user to connect their wallet
        const network = await provider.getNetwork();

        if (network.chainId !== TARGET_CHAIN_ID) {
          await switchNetwork(window.ethereum);
        }

        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setWallet(signer);
        setAddress(userAddress);
        setProviderType('MetaMask');
        setIsAuthenticated(true);
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
      const APP_NAME = 'MetaTasker';
      const APP_LOGO_URL = 'https://docs.base.org/img/logo_dark.svg';
      const DEFAULT_ETH_JSONRPC_URL = 'https://sepolia.base.org';

      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: APP_NAME,
        appLogoUrl: APP_LOGO_URL,
        darkMode: false
      });

      const ethereum = coinbaseWallet.makeWeb3Provider(DEFAULT_ETH_JSONRPC_URL, TARGET_CHAIN_ID);
      const provider = new BrowserProvider(ethereum);  // Use BrowserProvider for ethers@6

      await ethereum.request({ method: 'eth_requestAccounts' });
      const network = await provider.getNetwork();

      if (network.chainId !== TARGET_CHAIN_ID) {
        await switchNetwork(ethereum);
      }

      const signer = await provider.getSigner();
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
    } else if (window.coinbase && window.coinbase.selectedAddress) {
      connectCoinbase();
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
        <h1>MetaTasker Job Marketplace</h1>

        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="/verify" element={<Verification onLogin={handleLogin} />} />
            <Route path="/biometric-test" element={<BiometricTest />} />
            <Route
              path="/post-job"
              element={renderWithRestriction(JobPosting, { wallet, onJobPosted: () => {} })}
            />
            <Route
              path="/job-listings"
              element={renderWithRestriction(JobListings, { wallet })}
            />
            <Route path="/job/:jobId" element={renderWithRestriction(JobDetails)} />
            <Route path="/chat/:jobId" element={renderWithRestriction(Chat)} />
            <Route path="/previous-chats" element={renderWithRestriction(PreviousChats)} />
            <Route path="/job-applications" element={<JobApplications />} /> {/* New Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
