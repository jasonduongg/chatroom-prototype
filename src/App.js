// App.js

import React, { useState } from 'react';
import ChatRoom from './components/Chatroom/Chatroom.jsx';

function App() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        let result = await fetch('http://localhost:5000/register', {
            method: 'POST',
            body: JSON.stringify({ name, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        result = await result.json();
        if (result) {
            if (result.message === "This username is already taken. Please choose a different one.") {
                alert('This username is already taken. Please choose a different one.');
            } else {
                alert('User registered');
                setPassword('');
                setName('');
            }
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        let result = await fetch('http://localhost:5000/login', {
            method: 'POST',
            body: JSON.stringify({ name, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        result = await result.json();
        console.log(result);
        if (result.success) {
            setUser({ name, password });
            setIsLoggedIn(true);
        } else {
            alert('Invalid credentials');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUser(null);
    };

    return (
        <>
            {!isLoggedIn ? (
                <div className='h-[100vh] w-full flex justify-center pt-10'>
                    <div className='h-min w-[30vw] justify-center'>
                        <div>
                            <form>
                                    <input
                                        className='w-[100%] border-2 border-black mb-1 p-2'
                                        type="text"
                                        placeholder="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <input
                                        className='w-[100%] border-2 border-black p-2'
                                        type="text"
                                        placeholder="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div className='flex flex-row justify-end'>
                                        <div className='flex flex-row p-2 justify-right w-min'>
                                            <button className="border-2 border-black pr-2 pl-2 mr-2" onClick={handleRegister}>Register</button>
                                            <button className="border-2 border-black pr-2 pl-2" onClick={handleLogin}>Login</button>                    
                                        </div>
                                    </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className=''>
                    <div className='ml-8 mt-8'>
                        <button className="border-2 border-black p-2 rounded-lg bg-red-300" onClick={handleLogout}>Logout</button>
                    </div> 
                        <ChatRoom user={user} isLoggedIn={isLoggedIn} />
                </div>
            )}
        </>
    );
}

export default App;
