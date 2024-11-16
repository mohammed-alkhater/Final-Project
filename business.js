const crypto = require('crypto');
const { getUserCollection, getSessionCollection } = require('./persistence');
const persistence = require('./persistence')

async function registerUser (name, email, password, fluentLanguages, learningLanguages, photo) {
    if (!name || !email || !password) {
        throw new Error('All fields are required');
    }

    const userCollection = await getUserCollection();
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const verificationToken = crypto.randomBytes(16).toString('hex');
    const newUser = {
        name,
        email,
        password: hashedPassword,
        fluentLanguages,
        learningLanguages,
        photo,
        emailVerified: false,
        verificationToken,
        createdAt: new Date(),
    };

    await userCollection.insertOne(newUser);

    // Simulate sending a verification email
    const verificationUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
    console.log(`Verification email sent to: ${email}`);
    console.log(`Email content: Please click the following link to verify your email: ${verificationUrl}`);
};

async function loginUser (email, password) {
    let details = await persistence.getUserDetails(email);
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    const userCollection = await getUserCollection();
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Find user with matching email and password
    const user = await userCollection.findOne({ email, password: hashedPassword });
    if (!user) {
        return null;
    }

    // Create a session for the user
    const sessionCollection = await getSessionCollection();
    let sessionKey = crypto.randomUUID()

    let sd = {
        key: sessionKey,
        expiry: new Date(Date.now() + 1000*60*5),
        data: {
            email: details.email
        }
    }

    await sessionCollection.insertOne(sd);

    return sd; // Return the sessionId
};


const { ObjectId } = require('mongodb');

async function getUserBySession(sessionId) {
    const sessionCollection = await getSessionCollection();
    const session = await sessionCollection.findOne({ _id: new ObjectId(sessionId) });

    if (!session) {
        return null;
    }

    const userCollection = await getUserCollection();
    const user = await userCollection.findOne({ email: session.data.email });

    return user;
}


async function verifyEmail(token) {
    const userCollection = await getUserCollection();
    const user = await userCollection.findOne({ verificationToken: token });

    if (!user) {
        throw new Error('Invalid token');
    }

    await userCollection.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
    console.log('User email verified');
}

async function deleteSession(sessionId) {
    const sessionCollection = await getSessionCollection();
    await sessionCollection.deleteOne({ _id: new ObjectId(sessionId) });
}
module.exports = { registerUser, loginUser, getUserBySession, verifyEmail, deleteSession };
