const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://Cluster42218:elp9TW5qSHpq@cluster42218.epvsq.mongodb.net/';
const dbName = 'languageExchangeDB';
let db;

// Connect to the database
const connectDB = async () => {
    if (!db) {
        const client = new MongoClient(uri, { useUnifiedTopology: true });
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to MongoDB');
    }
    return db;
};

// Fetch user details by email
async function getUserDetails(email) {
    const userCollection = await getUserCollection();
    return await userCollection.findOne({ email: email });
}

// Get the users collection
const getUserCollection = async () => {
    const database = await connectDB();
    return database.collection('users');
};

// Get the sessions collection
const getSessionCollection = async () => {
    const database = await connectDB();
    return database.collection('session');
};

// Get the messages collection
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
async function getUserBadges(userEmail) {
    const userCollection = await getUserCollection();
    const user = await userCollection.findOne({ email: userEmail });
    if (!user) {
        console.log(`User with email ${userEmail} not found.`);
        return [];
    }
    return user.badges || [];
}

// Add a badge to a user
async function addUserBadge(userEmail, badgeName) {
    const userCollection = await getUserCollection();
    const result = await userCollection.updateOne(
        { email: userEmail },
        { $addToSet: { badges: badgeName } } // Add badge only if it doesn't already exist
    );
    if (result.matchedCount > 0) {
        console.log(`Badge "${badgeName}" added to user ${userEmail}`);
    } else {
        console.log(`Failed to add badge "${badgeName}" to user ${userEmail}`);
    }
    return result;
}

// Fetch total message count for a specific user
async function getUserMessageCount(userEmail) {
    const messagesCollection = await getMessagesCollection();
    const messageCount = await messagesCollection.countDocuments({ senderEmail: userEmail });
    console.log(`Message count for ${userEmail}: ${messageCount}`);
    return messageCount;
}

// Fetch distinct user IDs a user has communicated with
async function getDistinctCommunications(userEmail) {
    const messagesCollection = await getMessagesCollection();
    const distinctUsers = await messagesCollection.distinct('receiverEmail', { senderEmail: userEmail });
    console.log(`Distinct users communicated with by ${userEmail}: ${distinctUsers.length}`);
    return distinctUsers.length;
}

// Increment message counters for users
async function incrementMessageCounts(senderEmail, receiverEmail) {
    const userCollection = await getUserCollection();

    // Increment messagesSent for sender
    const senderUpdate = await userCollection.updateOne(
        { email: senderEmail },
        { $inc: { messagesSent: 1 } } // Increment messagesSent by 1
    );

    if (senderUpdate.matchedCount > 0) {
        console.log(`Incremented messagesSent for ${senderEmail}`);
    } else {
        console.log(`Failed to increment messagesSent for ${senderEmail}`);
    }

    // Increment messagesReceived for receiver
    const receiverUpdate = await userCollection.updateOne(
        { email: receiverEmail },
        { $inc: { messagesReceived: 1 } } // Increment messagesReceived by 1
    );

    if (receiverUpdate.matchedCount > 0) {
        console.log(`Incremented messagesReceived for ${receiverEmail}`);
    } else {
        console.log(`Failed to increment messagesReceived for ${receiverEmail}`);
    }
}

// Initialize user fields if they do not exist
async function initializeUserFields(email) {
    const userCollection = await getUserCollection();

    await userCollection.updateOne(
        { email },
        { 
            $setOnInsert: { 
                messagesSent: 0, 
                messagesReceived: 0, 
                badges: [] 
            } 
        },
        { upsert: true } // Insert if the user doesn't already exist
    );

    console.log(`Initialized fields for user ${email}`);
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
    getDistinctCommunications,
    incrementMessageCounts,
    initializeUserFields
};
