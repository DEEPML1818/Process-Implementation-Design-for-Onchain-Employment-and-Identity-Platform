import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as PushAPI from '@pushprotocol/restapi';
import { ChatWidget } from '@pushprotocol/uiweb';  // Correct import

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [walletAddress, setWalletAddress] = useState(null);

  // Connect wallet function
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      console.log("Connected wallet:", address); // Debug log
    } else {
      alert('Please install MetaMask to use this chat.');
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  // Fetch messages from Push Protocol
  const fetchMessages = async () => {
    if (!walletAddress) {
      alert("Wallet is not connected.");
      return;
    }

    try {
      const chat = await PushAPI.chat.getChats({
        accountAddress: `eip155:${walletAddress}`,  // User's wallet address
      });
      setMessages(chat); // Set the messages
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!walletAddress) {
      alert("Wallet is not connected.");
      return;
    }
    if (input.trim() === '') return;

    try {
      await PushAPI.chat.send({
        messageContent: input,
        messageType: 'Text',
        receiverAddress: 'eip155:receiverAddressHere', // Replace with correct receiver address
        accountAddress: `eip155:${walletAddress}`,
      });
      setInput('');
      fetchMessages();  // Fetch updated messages after sending a new one
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <p key={idx}><strong>{msg.sender}</strong>: {msg.messageContent}</p>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>

      {walletAddress && (
        <ChatWidget
          account={`eip155:${walletAddress}`}
          supportAddress="eip155:receiverAddressHere" // Replace with correct receiver address
        />
      )}
    </div>
  );
};

export default Chat;
