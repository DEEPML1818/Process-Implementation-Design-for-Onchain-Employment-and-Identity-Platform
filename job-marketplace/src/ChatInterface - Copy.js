import { useState, useEffect } from "react";
import { PushClient } from "@pushprotocol/client";

const pushClient = new PushClient();

function ChatInterface({ jobAddress }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      // Fetch chat history from your storage or use Push Protocol API to get past messages
      // This can be pushed to a database and fetched here
      const pastMessages = await pushClient.getChatHistory(jobAddress);
      setMessages(pastMessages);
    };
    fetchMessages();
  }, [jobAddress]);

  const sendMessage = async () => {
    if (!message) return;

    // Send message using Push Protocol
    await pushClient.send({
      to: "recipient_address",  // The other party involved in the job
      title: "New Message",
      body: message,
      type: "text",
    });

    setMessages([...messages, { from: "You", text: message }]);
    setMessage("");
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.from}: </strong>{msg.text}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatInterface;
