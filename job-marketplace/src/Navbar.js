import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ wallet, address, connectMetaMask, connectCoinbase, providerType }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);  // Modal state for wallet selection

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const openModal = () => {
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    return (
        <>
            <nav className="navbar">
                <div className="logo">
                    <h2>Job Marketplace</h2>
                </div>

                {/* Menu Toggle for mobile responsiveness */}
                <div className="menu-toggle" onClick={toggleMenu}>
                    <span className="hamburger"></span>
                    <span className="hamburger"></span>
                    <span className="hamburger"></span>
                </div>

                {/* Navigation Links */}
                <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
                    <li><Link to="/" onClick={toggleMenu}>Home</Link></li>
                    <li><Link to="/job-listings" onClick={toggleMenu}>Job Listings</Link></li>
                    <li><Link to="/post-job" onClick={toggleMenu}>Post Job</Link></li>
                    <li><Link to="/chat/1" onClick={toggleMenu}>Chats</Link></li>
                    <li><Link to="/previous-chats" onClick={toggleMenu}>Previous Chats</Link></li>
                    <li><Link to="/verify" onClick={toggleMenu}>Login</Link></li>
                    <li><Link to="/register" onClick={toggleMenu}>Sign Up</Link></li>
                    <li><Link to="/biometric-test" onClick={toggleMenu}>Biometric Test</Link></li>
                </ul>

                {/* Wallet Connection */}
                <div className="wallet">
                    {!wallet ? (
                        <button onClick={openModal} className="wallet-btn">Connect Wallet</button>
                    ) : (
                        <p className="wallet-address">Connected ({providerType}): {address.slice(0, 6)}...{address.slice(-4)}</p>
                    )}
                </div>
            </nav>

            {/* Modal for Wallet Selection */}
            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Select a Wallet</h3>
                        <button onClick={() => { connectMetaMask(); closeModal(); }} className="wallet-option-btn">MetaMask</button>
                        <button onClick={() => { connectCoinbase(); closeModal(); }} className="wallet-option-btn">Coinbase Wallet</button>
                        <button onClick={closeModal} className="close-btn">Close</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;
