import { useState, useEffect } from "react";

function ChatHistory() {
    const [chatLogs, setChatLogs] = useState([]);

    useEffect(() => {
        // Fetch chat history from a database or storage (off-chain)
        async function fetchChatLogs() {
            // Fetch old chats, replace with actual API call
            const oldChats = [
                { jobAddress: "0xJob1", logs: ["Hello", "How are you?", "Fine"] },
                { jobAddress: "0xJob2", logs: ["Question", "Answer"] }
            ];
            setChatLogs(oldChats);
        }

        fetchChatLogs();
    }, []);

    return (
        <div>
            <h2>Old Chat History</h2>
            {chatLogs.map((chat, index) => (
                <div key={index}>
                    <h3>Chat for Contract: {chat.jobAddress}</h3>
                    <ul>
                        {chat.logs.map((log, i) => (
                            <li key={i}>{log}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default ChatHistory;
