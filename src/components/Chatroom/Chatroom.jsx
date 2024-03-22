import React, { useState, useEffect, useCallback, useRef } from 'react';
import Ably from 'ably';
import axios from 'axios'; // Import axios for making HTTP requests

function ChatRoom({ user, isLoggedIn }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [ablyClient, setAblyClient] = useState(null);
    const [channel, setChannel] = useState(null);
    const bottomOfChat = useRef(null);

    useEffect(() => {
        if (bottomOfChat.current) {
            bottomOfChat.current.scrollIntoView();
        }
    }, [messages]);

    const initializeChat = async () => {
        if (isLoggedIn && !ablyClient) {
            try {
                const response = await fetch('http://localhost:5000/fetchMessages');
                const fetchedMessages = await response.json();
                const parsedMessages = fetchedMessages.map(message => message.user + ": " + message.text);
                setMessages(parsedMessages);
                const ablyKey = 'gWdAvw.DxcdmQ:WYmbfWlXmbZBC5UeOKWXretPGWjPUCb_F-_x9-JpME4'
                const client = new Ably.Realtime.Promise({ key: ablyKey });
                const chatChannel = client.channels.get('chat');
                chatChannel.subscribe((message) => {
                    setMessages(prevMessages => [...prevMessages, message.data]);
                });
                setAblyClient(client);
                setChannel(chatChannel);
            
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        }
    };

    useEffect(() => {
        if (isLoggedIn && !ablyClient) {
            initializeChat();
        }

    }, [isLoggedIn]);

    const sendMessage = async () => {
        if (channel && newMessage.trim() !== '') {
            let concat = user.name + ": " + newMessage
            channel.publish("update", concat);
            await fetch('http://localhost:5000/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: user.name,
                    text: newMessage.trim()
                })
            });
            setNewMessage('');
        }
    };
    
    return (
        <div className = "flex flex-row justify-center items-center">
            <div className = "w-min">
                <h1 className='text-2xl mb-2'>Augment-me Chatroom Prototype</h1>
                <div className='h-[300px] w-[500px] overflow-scroll snap-y border-2 border-black mb-2' >
                    {messages.map((message, index) => (
                        <div key={index}>
                            <p className='text-lg pl-2'>{message}</p>
                        </div>
                    ))}
                    <div ref={bottomOfChat}></div>
                </div>
                <input className="border-2 border-black" type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <button className = "border-2 border-black ml-2 pl-2 pr-2" onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default ChatRoom;
