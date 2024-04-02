import React, { useState, useEffect, useRef } from 'react';
import Ably from 'ably';
import { v4 as uuidv4 } from 'uuid';

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

    const initializeChat = async () => {
        if (isLoggedIn && !ablyClient) {
            try {
                const response = await fetch('http://localhost:5000/fetchMessages');
                const fetchedMessages = await response.json();
                const parsedMessages = fetchedMessages.map(message => {
                    const { uuid, user, text, pollOptions } = message;
                    const poll = pollOptions
                    ? Object.keys(pollOptions).reduce((acc, key) => {
                        acc[key] = pollOptions[key];
                        return acc;
                        }, {})
                    : {}
                    return {
                        uuid, uuid,
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
            const uuid = uuidv4();
            let concat = {uuid: uuid, username: user.name, message: newMessage, pollOptions: pollOptions}
            channel.publish("update", concat);
            await fetch('http://localhost:5000/sendMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uuid: uuid,
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
                answer: "",
                votes: 0
            }
        }));
    };

    const handlePollOptionChange = (index, value) => {
        setPollOptions(prevOptions => ({
            ...prevOptions,
            [index]: { 
                ...prevOptions[index],
                answer: value,
                votes: prevOptions[index].votes // Keep the previous votes unchanged
            }
        }));
    };

    const handleVote = (uuid, voteIndex) => {
        // Construct the URL for the API endpoint
        const apiUrl = `http://localhost:5000/vote/${uuid}/${voteIndex}`;
        
        // Make a PUT request to the API endpoint
        fetch(apiUrl, {
            method: 'PUT', // Use PUT method
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to vote');
            }
            console.log('Vote successful');
            console.log(response)
            // channel.publish({
            //     name: '',
            //     data: response,
            //     extras: {
            //       ref: {
            //         type: "vote-change",
            //         uuid: uuid,
            //       }
            //     }
            //   })
        })
        .catch(error => {
            console.error('Error voting:', error);
        });
    };
    

    return (
        <div className="flex flex-row justify-center items-center">
            <div className="w-min">
                <h1 className='text-2xl mb-2'>Admin Chatroom Prototype</h1>
                <div className='h-[300px] w-[500px] overflow-scroll snap-y border-2 border-black mb-2'>

                {Object.entries(messages).map(([index, message]) => (
                    <div key={index}>
                        <p className='text-lg pl-2'>{message.username + ": " + message.message}</p> {/* Render message text */}
                        {Object.keys(message.pollOptions).length > 0 && (
                            <div className='w-full h-full pl-4 pr-4'>
                                <div className='text-center'>
                                    <p> Poll Options:</p>
                                </div>
                                <ul>
                                    {Object.entries(message.pollOptions).map(([index, option]) => (
                                        <div key={index} className='flex flex-row justify-between mb-2'>    
                                            <div key={index} className="flex flex-row justify-between border-2 border-black w-full pl-2 pr-2 mr-2 inline-flex items-center align-middle">
                                                <p>{index + ") " +option.answer}</p>
                                                <p>{option.votes}</p>
                                            </div>
                                            <button className="border-2 border-black p-1" onClick={() => handleVote(message.uuid, index)}>Vote</button>
                                        </div>
                                        
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>
                ))}

                    <div ref={bottomOfChat}></div>
                </div>
                <div>
                    <textarea className="border-2 border-black w-full min-h-min" type="text" value={newMessage} placeholder="message Chatroom" onChange={(e) => setNewMessage(e.target.value)} />
                    <p> Add Poll Options </p>
                    <div className="w-full h-64">
                        <div className='flex flex-col'>
                        {Object.entries(pollOptions).map(([index, option]) => (
                        <input
                            key={index}
                            className="border-2 border-black"
                            value={option.question} 
                            placeholder={`Enter Text`}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)} // Update question text for the corresponding index
                        />
                         ))}
                        <button onClick={addPollOption}>+</button>
                        </div>
                    </div>

                    <button className="border-2 border-black pl-2 pr-2" onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
}

export default AdminChatroom;
