const crypto = require('crypto');
const { getUserCollection } = require('./persistence');

const registerUser = async (name, email, password, fluentLanguages, learningLanguages, photo) => {
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

module.exports = { registerUser };
