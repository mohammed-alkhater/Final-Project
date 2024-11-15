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

const getUserCollection = async () => {
    const database = await connectDB();
    return database.collection('users');
};

module.exports = { connectDB, getUserCollection };
