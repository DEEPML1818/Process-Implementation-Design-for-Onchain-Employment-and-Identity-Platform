import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JobListings from './pages/JobListings';
import JobDetails from './pages/JobDetails';
import Chat from './pages/Chat';
import Register from './components/Register';  // Register for sign-up
import Verification from './components/Verification';  // Verification for log-in
import PreviousChats from './pages/PreviousChats';
import Navbar from './Navbar';
import Home from './pages/Home';  // Main landing page
import JobPosting from './JobPosting'; // Job Posting component
import BiometricTest from './components/BiometricTest'; // Biometric Test component
import './App.css';  // Import the App CSS for the background theme


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const renderWithRestriction = (Component, props) => {
    return isAuthenticated ? (
      <Component {...props} />
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
      <Navbar />
      <div className="app-container">
        <h1>Web3 Job Marketplace</h1>

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
            element={renderWithRestriction(JobPosting, { wallet: window.ethereum, onJobPosted: () => {} })}
          />

          {/* Job Listings page */}
          <Route
            path="/job-listings"
            element={renderWithRestriction(JobListings, { wallet: window.ethereum })}
          />

          {/* Job details, chat, and previous chats */}
          <Route path="/job/:jobId" element={renderWithRestriction(JobDetails)} />
          <Route path="/chat/:jobId" element={renderWithRestriction(Chat)} />
          <Route path="/previous-chats" element={renderWithRestriction(PreviousChats)} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
