const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory message storage
let messages = {};

// Get messages for a customer
app.get('/api/messages/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    res.json(messages[customerId] || []);
});

// Send message (customer or admin)
app.post('/api/messages/:customerId', (req, res) => {
    const customerId = req.params.cusconst express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['websocket', 'polling']
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// File paths for data storage
const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Initialize data files
function initDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(MESSAGES_FILE)) {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify({}, null, 2));
    }
}
initDataFiles();

// Read/Write helpers
function getUsers() {
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getMessages() {
    const data = fs.readFileSync(MESSAGES_FILE);
    return JSON.parse(data);
}

function saveMessages(messages) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Admin credentials
const ADMIN = { username: 'admin', password: 'admin123' };

// API Routes

// User Registration
app.post('/api/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    const users = getUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        password: password || 'user123',
        registeredAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    res.json({ 
        success: true, 
        message: 'Registration successful!',
        userId: newUser.id,
        user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
});

// User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (user && (user.password === password || !password)) {
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN.username && password === ADMIN.password) {
        res.json({ success: true, token: 'admin-token-' + Date.now() });
    } else {
        res.status(401).json({ success: false });
    }
});

// Get all users for admin
app.get('/api/users', (req, res) => {
    const users = getUsers();
    res.json(users);
});

// Get conversation for a specific user
app.get('/api/messages/:userId', (req, res) => {
    const userId = req.params.userId;
    const messages = getMessages();
    res.json(messages[userId] || []);
});

// Get all conversations for admin
app.get('/api/conversations', (req, res) => {
    const messages = getMessages();
    const users = getUsers();
    
    const conversations = Object.keys(messages).map(userId => {
        const userMessages = messages[userId];
        const lastMessage = userMessages[userMessages.length - 1];
        const user = users.find(u => u.id === userId);
        const unreadCount = userMessages.filter(m => m.sender === 'user' && !m.read).length;
        
        return {
            userId,
            userName: user?.name || 'Unknown User',
            userEmail: user?.email || '',
            userPhone: user?.phone || '',
            lastMessage: lastMessage?.text || 'No messages',
            lastMessageTime: lastMessage?.timestamp || new Date(),
            unreadCount,
            messages: userMessages
        };
    });
    
    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    res.json(conversations);
});

// Mark messages as read
app.post('/api/mark-read/:userId', (req, res) => {
    const userId = req.params.userId;
    const messages = getMessages();
    
    if (messages[userId]) {
        messages[userId].forEach(msg => {
            if (msg.sender === 'user') msg.read = true;
        });
        saveMessages(messages);
    }
    res.json({ success: true });
});

// Socket.IO for real-time messaging
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join', (data) => {
        const { userId, role } = data;
        socket.userId = userId;
        socket.role = role;
        
        onlineUsers.set(userId, { socketId: socket.id, role });
        console.log(`${role} ${userId} joined. Online: ${onlineUsers.size}`);
        
        // Notify admin if user is online
        if (role === 'user') {
            io.emit('user-online', { userId, status: 'online' });
        }
    });
    
    socket.on('send-message', (data) => {
        const { to, from, text, sender, userName } = data;
        
        const message = {
            id: Date.now(),
            text: text,
            sender: sender,
            userName: userName || (sender === 'admin' ? 'Admin' : 'User'),
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // Store message
        const userId = sender === 'user' ? from : to;
        const messages = getMessages();
        if (!messages[userId]) messages[userId] = [];
        messages[userId].push(message);
        saveMessages(messages);
        
        // Send to recipient if online
        const recipient = onlineUsers.get(to);
        if (recipient) {
            io.to(recipient.socketId).emit('new-message', {
                ...message,
                from: from,
                to: to
            });
        }
        
        socket.emit('message-sent', { success: true });
        
        // Notify admin about new message
        if (sender === 'user') {
            io.emit('new-user-message', { userId: from, message: text });
        }
    });
    
    socket.on('typing', (data) => {
        const { to, from, isTyping, userName } = data;
        const recipient = onlineUsers.get(to);
        if (recipient) {
            io.to(recipient.socketId).emit('user-typing', {
                from: from,
                isTyping: isTyping,
                userName: userName
            });
        }
    });
    
    socket.on('disconnect', () => {
        for (let [userId, data] of onlineUsers.entries()) {
            if (data.socketId === socket.id) {
                onlineUsers.delete(userId);
                if (data.role === 'user') {
                    io.emit('user-online', { userId, status: 'offline' });
                }
                break;
            }
        }
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Admin login: admin / admin123`);
});tomerId;
    const { text, sender } = req.body;
    
    if (!messages[customerId]) messages[customerId] = [];
    messages[customerId].push({
        text,
        sender: sender || 'customer',
        timestamp: new Date()
    });
    res.json({ success: true });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'admin-token-123' });
    } else {
        res.status(401).json({ success: false });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});