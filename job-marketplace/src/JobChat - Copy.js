// src/JobChat.js
import React, { useState, useEffect } from "react";
import { PushAPI } from "@pushprotocol/restapi";  // Import Push Protocol REST API
import { ethers } from "ethers";

function JobChat({ wallet, jobAddress }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [chatInitialized, setChatInitialized] = useState(false);
  const [streamId, setStreamId] = useState("");  // Store chat stream ID

  // Initialize chat when the component is mounted
  useEffect(() => {
    if (wallet && jobAddress && !chatInitialized) {
      initChat();
    }
  }, [wallet, jobAddress, chatInitialized]);

  // Initialize the chat with Push Protocol using the job address
  const initChat = async () => {
    try {
      const streamKey = ethers.utils.id(jobAddress);  // Generate a unique stream ID from job address

      // Create a chat stream with Push Protocol
      await PushAPI.chat.create({
        account: wallet.address,  // User's wallet address
        stream: streamKey,        // Unique chat stream ID
      });

      setStreamId(streamKey);
      setChatInitialized(true);
      fetchChatHistory(streamKey);  // Fetch previous chat messages
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  // Fetch previous chat messages from Push Protocol
  const fetchChatHistory = async (streamKey) => {
    try {
      const history = await PushAPI.chat.history({
        account: wallet.address,
        stream: streamKey,
      });
      setMessages(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  // Send a message using Push Protocol
  const sendMessage = async () => {
    if (messageInput.trim() && chatInitialized) {
      try {
        await PushAPI.chat.send({
          message: messageInput,
          stream: streamId,       // Use stream ID for the job
          account: wallet.address, // Current user's address
        });

        // Update the local message state
        setMessages((prevMessages) => [
          ...prevMessages,
          { message: messageInput, sender: wallet.address },
        ]);
        setMessageInput("");  // Clear the input field
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  return (
    <div>
      <h2>Job Chat for Contract: {jobAddress}</h2>

      {/* Chat message display */}
      <div style={{ height: "300px", overflowY: "scroll", border: "1px solid gray", padding: "10px" }}>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}</strong>: {msg.message}
          </p>
        ))}
      </div>

      {/* Input field for sending messages */}
      {chatInitialized ? (
        <div>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      ) : (
        <p>Initializing chat...</p>
      )}
    </div>
  );
}

export default JobChat;
