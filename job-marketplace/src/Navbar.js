import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import './Navbar.css';

function Navbar({ wallet, connectMetaMask, connectCoinbase, providerType }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [networkName, setNetworkName] = useState('Unknown Network');

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const openModal = () => {
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    // Handle network selection for Base Sepolia Testnet
    const handleNetworkChange = () => {
        setNetworkName("Base Sepolia Testnet");
    };

    useEffect(() => {
        if (wallet) {
            handleNetworkChange();
        }
    }, [wallet]);

    return (
        <>
            <nav className="navbar">
                <div className="logo">
                    <h2>MetaTasker</h2>
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
                    <li><Link to="/previous-chats" onClick={toggleMenu}>Ticket history</Link></li>
                    <li><Link to="/verify" onClick={toggleMenu}>Login</Link></li>
                    <li><Link to="/register" onClick={toggleMenu}>Sign Up</Link></li>
                    <li><Link to="/biometric-test" onClick={toggleMenu}>Biometric Test</Link></li>
                </ul>

                {/* Wallet Connection */}
                <div className="wallet">
                    {!wallet ? (
                        <button onClick={openModal} className="wallet-btn">Connect Wallet</button>
                    ) : (
                        <>
                            <label htmlFor="network-select" className="network-label">Network:</label>
                            <select
                                id="network-select"
                                value={networkName}
                                onChange={handleNetworkChange}
                                className="network-select"
                            >
                                <option value="Base Sepolia Testnet">Base Sepolia Testnet</option>
                            </select>
                        </>
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
