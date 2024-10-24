import { useState, useEffect } from "react";
import { PushClient } from "@pushprotocol/client";

const pushClient = new PushClient();

function ChatHistoryPage({ jobAddress }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      // Fetch chat history from Push Protocol or wherever they are stored
      const pastMessages = await pushClient.getChatHistory(jobAddress);
      setMessages(pastMessages);
    };
    fetchMessages();
  }, [jobAddress]);

  return (
    <div>
      <h2>Chat History for Job {jobAddress}</h2>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.from}: </strong>{msg.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export default ChatHistoryPage;
