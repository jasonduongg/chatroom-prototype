const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const mongoURL = 'mongodb+srv://jasonduong:X5vlklJV5UNMeHzx@chatroomcluster.ctluafb.mongodb.net/chatroom?retryWrites=true&w=majority';

async function connectToDatabase() {
    try {
        await mongoose.connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }
}

connectToDatabase();

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const messageSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', messageSchema);

app.get('/', (req, res) => {
    res.send('App is Working');
});

app.post('/register', async (req, res) => {
    try {
        const { name, password } = req.body;

        const existingUserByName = await User.findOne({ name: name });
        if (existingUserByName) {
            return res.status(400).json({ message: 'This username is already taken. Please choose a different one.' });
        }

        const user = new User({ name, password });
        const result = await user.save();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});



app.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findOne({ name, password });
        if (user) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

app.post('/sendMessage', async (req, res) => {
    try {
        const { user, text } = req.body;
        const message = new Message({ user, text });
        await message.save();
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error saving message' });
    }
});

app.get('/fetchMessages', async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

app.get('/clearMessages', async (req, res) => {
    try {
        // Delete all messages from the Message collection
        await Message.deleteMany({});
        
        res.status(200).json({ success: true, message: 'Messages cleared successfully' });
    } catch (error) {
        console.error('Error clearing messages:', error);
        res.status(500).json({ success: false, message: 'Error clearing messages' });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
