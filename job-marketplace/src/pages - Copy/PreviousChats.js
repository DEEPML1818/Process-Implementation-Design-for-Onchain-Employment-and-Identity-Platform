import React, { useEffect, useState } from 'react';
import * as PushAPI from '@pushprotocol/restapi';

function PreviousChats({ wallet }) {
    const [previousChats, setPreviousChats] = useState([]);

    useEffect(() => {
        // Fetch previous chats
        async function fetchPreviousChats() {
            const chatHistory = await PushAPI.chat.history({
                account: wallet.getAddress(),
                toDecrypt: true,
                pgpPrivateKey: 'your-private-key', // Replace with user's PGP key
                env: 'prod',
            });
            setPreviousChats(chatHistory.messages);
        }

        fetchPreviousChats();
    }, [wallet]);

    return (
        <div>
            <h2>Previous Chats</h2>
            <ul>
                {previousChats.map((chat, index) => (
                    <li key={index}>
                        <p>{chat.messageContent}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PreviousChats;
