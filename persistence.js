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



module.exports = { connectDB, getUserCollection, getSessionCollection, getUserDetails};