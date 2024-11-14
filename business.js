const bcrypt = require('bcrypt');
const persistence = require('./persistence');

// User registration logic
async function registerUser(userData) {
    const { email, password } = userData;
    const existingUser = await persistence.findUserByEmail(email);
    if (existingUser) throw new Error('Email already registered');
    userData.password = await bcrypt.hash(password, 10);
    userData.verified = false;
    return await persistence.createUser(userData);
}

// User authentication logic
async function authenticateUser(email, password) {
    const user = await persistence.findUserByEmail(email);
    if (!user) throw new Error('User not found');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid password');
    if (!user.verified) throw new Error('User not verified');
    return user;
}

// Add contact logic
async function addContact(userId, contactId) {
    return await persistence.addContactToUser(userId, contactId);
}

// Remove contact logic
async function removeContact(userId, contactId) {
    return await persistence.removeContactFromUser(userId, contactId);
}

// Send message logic
async function sendMessage(senderId, recipientId, content) {
    const sender = await persistence.findUserById(senderId);
    const recipient = await persistence.findUserById(recipientId);
    if (!recipient) throw new Error('Recipient not found');
    const message = { senderId, content, timestamp: new Date() };
    await persistence.addMessageToUser(recipientId, message);
    return message;
}

// Block user logic
async function blockUser(userId, blockedUserId) {
    const user = await persistence.findUserById(userId);
    if (user.blockedUsers.includes(blockedUserId)) {
        throw new Error('User already blocked');
    }
    user.blockedUsers.push(blockedUserId);
    return await persistence.updateUser(userId, { blockedUsers: user.blockedUsers });
}

module.exports = {
    registerUser,
    authenticateUser,
    addContact,
    removeContact,
    sendMessage,
    blockUser
};
