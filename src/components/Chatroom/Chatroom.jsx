import React, { useState, useEffect, useRef } from 'react';
import Ably from 'ably';
import axios from 'axios'; // Import axios for making HTTP requests

function AdminChatroom({ user, isLoggedIn }) {
    const [messages, setMessages] = useState({});
    const [ablyClient, setAblyClient] = useState(null);
    const [channel, setChannel] = useState(null);

    const [newMessage, setNewMessage] = useState('');
    const [pollOptions, setPollOptions] = useState({});

    const bottomOfChat = useRef(null);

    useEffect(() => {
        if (bottomOfChat.current) {
            bottomOfChat.current.scrollIntoView();
        }
    }, [messages]);
    console.log(messages)
    const initializeChat = async () => {
        if (isLoggedIn && !ablyClient) {
            try {
                const response = await fetch('http://localhost:5000/fetchMessages');
                const fetchedMessages = await response.json();
                const parsedMessages = fetchedMessages.map(message => {
                    const { user, text, pollOptions } = message;
                    const poll = pollOptions
                    ? Object.keys(pollOptions).reduce((acc, key) => {
                        acc[key] = pollOptions[key];
                        return acc;
                        }, {})
                    : null;
                    return {
                        username: user,
                        message: text,
                        pollOptions: poll
                    };
                });                
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
            let concat = {username: user.name, message: newMessage, pollOptions: pollOptions}
            channel.publish("update", concat);
            await fetch('http://localhost:5000/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: user.name,
                    text: newMessage.trim(),
                    pollOptions: pollOptions
                })
            });
            setNewMessage('');
            setPollOptions({})
        }
    };

    const addPollOption = () => {
        const index = Object.keys(pollOptions).length;
        setPollOptions(prevOptions => ({
            ...prevOptions,
            [index]: { 
                ...prevOptions[index],
                question: "",
                votes: 0
            }
        }));
    };

    const handlePollOptionChange = (index, value) => {
        setPollOptions(prevOptions => ({
            ...prevOptions,
            [index]: { 
                ...prevOptions[index],
                question: value,
                votes: prevOptions[index].votes // Keep the previous votes unchanged
            }
        }));
    };
    console.log(messages)

    return (
        <div className="flex flex-row justify-center items-center">
            <div className="w-min">
                <h1 className='text-2xl mb-2'>User Chatroom Prototype</h1>
                <div className='h-[300px] w-[500px] overflow-scroll snap-y border-2 border-black mb-2'>

                {Object.entries(messages).map(([index, message]) => (
                    <div key={index}>
                        <p className='text-lg pl-2'>{message.username + ": " + message.message}</p> {/* Render message text */}
                        {message.pollOptions && (
                            <div className='bg-blue-500 w-full h-full pl-4 pr-4'>
                                <p> Poll Options:</p>
                                <ul>
                                    {Object.entries(message.pollOptions).map(([index, option]) => (
                                        <li key={index}>{option.question}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}

                    <div ref={bottomOfChat}></div>
                </div>
                <div>
          
                </div>
            </div>
        </div>
    );
}

export default AdminChatroom;
