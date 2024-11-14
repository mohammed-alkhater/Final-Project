const mongoose = require('mongoose');
const { User } = require('./models/user');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/languageExchange', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Function to create a new user
async function createUser(userData) {
    const user = new User(userData);
    return await user.save();
}

// Function to find a user by email
async function findUserByEmail(email) {
    return await User.findOne({ email });
}

// Function to find a user by ID
async function findUserById(userId) {
    return await User.findById(userId);
}

// Function to add a contact
async function addContactToUser(userId, contactId) {
    const user = await User.findById(userId);
    if (!user.contacts.includes(contactId)) {
        user.contacts.push(contactId);
        return await user.save();
    } else {
        throw new Error('Contact already exists');
    }
}

// Function to remove a contact
async function removeContactFromUser(userId, contactId) {
    const user = await User.findById(userId);
    user.contacts = user.contacts.filter(id => id.toString() !== contactId);
    return await user.save();
}

// Function to add a message to a user
async function addMessageToUser(userId, messageData) {
    const user = await User.findById(userId);
    user.messages.push(messageData);
    return await user.save();
}

// Function to update a user
async function updateUser(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
}

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    addContactToUser,
    removeContactFromUser,
    addMessageToUser,
    updateUser
};
