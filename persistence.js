const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://Cluster42218:elp9TW5qSHpq@cluster42218.epvsq.mongodb.net/';
const dbName = 'languageExchangeDB';
let db;

const connectDB = async () => {
    if (!db) {
        const client = new MongoClient(uri, { useUnifiedTopology: true });
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to MongoDB');
    }
    return db;
};

async function getUserDetails(email) {
    const userCollection = await getUserCollection();
    return await userCollection.findOne({ email: email })
}

const getUserCollection = async () => {
    const database = await connectDB();
    return database.collection('users');
};

const getSessionCollection = async () => {
    const database = await connectDB();
    return database.collection('session');
};

const getMessagesCollection = async () => {
    const database = await connectDB();
    return database.collection('messages');
};

// New Functions for Badge System
const getBadgesCollection = async () => {
    const database = await connectDB();
    return database.collection('badges');
};

// Fetch badges for a specific user
async function getUserBadges(userId) {
    const badgesCollection = await getBadgesCollection();
    const userBadges = await badgesCollection.findOne({ userId: userId });
    return userBadges ? userBadges.badges : [];
}

// Add a badge to a user
async function addUserBadge(userId, badgeName) {
    const badgesCollection = await getBadgesCollection();
    const result = await badgesCollection.updateOne(
        { userId: userId },
        { $addToSet: { badges: badgeName } }, // Add badge only if it doesn't already exist
        { upsert: true } // Create a new record if it doesn't exist
    );
    return result;
}

// Fetch all user messages
async function getUserMessageCount(userId) {
    const messagesCollection = await getMessagesCollection();
    const messageCount = await messagesCollection.countDocuments({ senderId: userId });
    return messageCount;
}

// Fetch distinct user IDs a user has communicated with
async function getDistinctCommunications(userId) {
    const messagesCollection = await getMessagesCollection();
    const distinctUsers = await messagesCollection.distinct('receiverId', { senderId: userId });
    return distinctUsers.length;
}

module.exports = { 
    connectDB, 
    getUserCollection, 
    getSessionCollection, 
    getUserDetails, 
    getMessagesCollection,
    getUserBadges,
    addUserBadge,
    getUserMessageCount,
    getDistinctCommunications
};
