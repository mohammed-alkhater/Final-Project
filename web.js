const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const { registerUser, authenticateUser, addContact, removeContact, sendMessage, blockUser } = require('./business');

const app = express();
const PORT = 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(csrf());
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Routes

// User registration
app.post('/register', async (req, res) => {
    try {
        const newUser = await registerUser(req.body);
        res.status(201).json({ message: 'User registered successfully. Please verify your email.', user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// User login
app.post('/login', async (req, res) => {
    try {
        const user = await authenticateUser(req.body.email, req.body.password);
        req.session.userId = user._id; // Set session data
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Add a contact
app.post('/addContact', async (req, res) => {
    try {
        const updatedUser = await addContact(req.session.userId, req.body.contactId);
        res.status(200).json({ message: 'Contact added successfully', user: updatedUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Remove a contact
app.post('/removeContact', async (req, res) => {
    try {
        const updatedUser = await removeContact(req.session.userId, req.body.contactId);
        res.status(200).json({ message: 'Contact removed successfully', user: updatedUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Send a message
app.post('/sendMessage', async (req, res) => {
    try {
        const message = await sendMessage(req.session.userId, req.body.recipientId, req.body.content);
        res.status(200).json({ message: 'Message sent', data: message });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Block a user
app.post('/blockUser', async (req, res) => {
    try {
        const updatedUser = await blockUser(req.session.userId, req.body.blockedUserId);
        res.status(200).json({ message: 'User blocked successfully', user: updatedUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
