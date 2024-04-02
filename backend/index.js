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
    registerAdmin: {
        type: Boolean,
        required: true,
    },
});

const messageSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    pollOptions: {
        type: Object,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
});


const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', messageSchema);

app.get('/', (req, res) => {
    res.send('App is Working');
});

app.post('/register', async (req, res) => {
    try {

        const { name, password, registerAdmin } = req.body;
        const existingUserByName = await User.findOne({ name: name });
        if (existingUserByName) {
            return res.status(400).json({ message: 'This username is already taken. Please choose a different one.' });
        }
        const user = new User({ name, password, registerAdmin });
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
            res.json({ success: true, user: user });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});


app.post('/sendMessage', async (req, res) => {
    try {
        const { uuid, user, text, pollOptions } = req.body;
        
        // Ensure pollOptions is provided and is an object
        const messageData = pollOptions ? { uuid, user, text, pollOptions } : { uuid, user, text };
        
        const message = new Message(messageData);
        
        console.log(message);
        
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

app.put('/vote/:uuid/:voteIndex', async (req, res) => {
    const { uuid, voteIndex } = req.params;

    try {
        const message = await Message.findOne({ uuid: uuid });

        if (!message) {
            return res.status(404).send({ error: 'Message not found' });
        }

        if (message.pollOptions.hasOwnProperty(voteIndex)) {
            message.pollOptions[voteIndex].votes += 1;
            message.markModified('pollOptions');
            await message.save();
            res.send({ success: true, message: 'Vote registered' });
        } else {
            res.status(400).send({ error: 'Invalid poll option index' });
        }
    } catch (error) {
        console.error('Error updating vote:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
