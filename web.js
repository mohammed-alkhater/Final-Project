const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const { registerUser, loginUser, getUserBySession, verifyEmail, deleteSession, updateUserPassword, updateUserResetKey, getUserDetailsbyEmail, findUsersByLanguages, addContact, removeContact, blockUser, isUserBlocked, unblockUser, sendMessage, getMessages } = require('./business');
const crypto = require('crypto');

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/uploads', express.static('uploads'));

// Register Handlebars helpers
const hbs = exphbs.create({
    helpers: {
        includes: function(array, value) {
            return array && array.includes(value.toString());
        },
        eq: function(a, b) {
            return a === b;
        }
    }
});

// Set up view engine
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/register', (req, res) => {
    res.render('register', { message: req.query.message });
});


// Handle registration
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, fluentLanguages, learningLanguages } = req.body;
        let photo = null;
        const fluentLanguagesArray = fluentLanguages.split(',').map(lang => lang.trim());
        const learningLanguagesArray = learningLanguages.split(',').map(lang => lang.trim());

        if (req.files && req.files.photo) {
            const photoFile = req.files.photo;
            const uploadPath = 'uploads/' + photoFile.name;
            await photoFile.mv(uploadPath);
            photo = uploadPath;
        }

        await registerUser(name, email, password, fluentLanguagesArray, learningLanguagesArray, photo);

        res.redirect('/?message=Registration Successful. Check your email.');
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Render the login page
app.get('/login', (req, res) => {
    res.render('login', { message: req.query.message });
});

// Handle login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Attempting login with email: ${email}`);
        
        let session = await loginUser(email, password);
        console.log(`LoginUser returned: ${JSON.stringify(session)}`);
        
        if (session && session._id) {
            const sessionId = session._id.toString();
            console.log('Session ID is ' + sessionId);
            // Redirect to dashboard with session ID in query parameters
            res.redirect(`/dashboard?sessionId=${sessionId}`);
        } else {
            console.log('Login failed: Invalid email or password');
            res.redirect('/login?message=Invalid email or password');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});


// Render the dashboard page
app.get('/dashboard', async (req, res) => {
    try {
        const sessionId = req.query.sessionId;
        console.log(`Dashboard accessed with session ID: ${sessionId}`);
        const user = await getUserBySession(sessionId);
        console.log(`User found: ${JSON.stringify(user)}`);

        if (user) {
            const usersByLanguages = await findUsersByLanguages(user.learningLanguages);
            const contacts = user.contacts || [];
            const filteredUsers = usersByLanguages.filter(u => !user.blockedUsers.includes(u.email));
            res.render('dashboard', { name: user.name, photo: user.photo, sessionId, usersByLanguages: filteredUsers, contacts });
        } else {
            res.redirect('/login?message=Please log in to access the dashboard');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Render the index page
app.get('/', (req, res) => {
    res.render('index', { message: req.query.message });
});


// Handle email verification
app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    verifyEmail(token);
    console.log(`Verifying email with token: ${token}`);
    res.render('verify-email', { token });
});


// Handle logout
app.get('/logout', (req, res) => {
    const sessionId = req.query.sessionId;
    console.log(`This is the session: ${sessionId}`);
    if (!sessionId) {
        console.log('Session ID is missing');
    }
    console.log(`Logging out session: ${sessionId}`);
    deleteSession(sessionId);
    res.redirect('/login');
});

// Handle forgot password
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});


// Handle forgot password
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await getUserDetailsbyEmail(email);
    if (user) {
        const resetKey = crypto.randomBytes(16).toString('hex');
        await updateUserResetKey(email, resetKey);
        const resetUrl = `http://localhost:3000/reset-password?key=${resetKey}`;
        console.log(`Reset URL: ${resetUrl}`);
        // Send email with resetUrl (email sending logic not shown here)
    }
    res.redirect('/forgot-password?message=If the email exists, a reset link has been sent.');
});


// Handle reset password
app.get('/reset-password', (req, res) => {
    const { key } = req.query;
    res.render('reset-password', { key });
});

// Handle reset password
app.post('/reset-password', async (req, res) => {
    const { key, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.redirect(`/reset-password?key=${key}&message=Passwords do not match`);
    }
    const success = await updateUserPassword(key, password);
    if (success) {
        res.redirect('/login?message=Password reset successful. Please log in.');
    } else {
        res.redirect(`/reset-password?key=${key}&message=Invalid or expired reset key`);
    }
});


// Handle adding and removing contacts
app.post('/add-contact', async (req, res) => {
    try {
        const { sessionId, contactEmail } = req.body;
        const user = await getUserBySession(sessionId);
        if (user) {
            await addContact(user.email, contactEmail);
            res.redirect(`/dashboard?sessionId=${sessionId}`);
        } else {
            res.redirect('/login?message=Please log in to add contacts');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});


// Handle removing contacts
app.post('/remove-contact', async (req, res) => {
    try {
        const { sessionId, contactEmail } = req.body;
        const user = await getUserBySession(sessionId);
        if (user) {
            await removeContact(user.email, contactEmail);
            res.redirect(`/dashboard?sessionId=${sessionId}`);
        } else {
            res.redirect('/login?message=Please log in to remove contacts');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

const { getUserCollection } = require('./persistence');


// Handle blocking and unblocking users
app.get('/view-contacts', async (req, res) => {
    try {
        const sessionId = req.query.sessionId;
        const user = await getUserBySession(sessionId);

        if (user) {
            const contacts = user.contacts || [];
            const userCollection = await getUserCollection();
            const contactUsers = await userCollection.find({ email: { $in: contacts } }).toArray();

            // Check if each contact is blocked
            for (let contact of contactUsers) {
                contact.isBlocked = await isUserBlocked(contact.email, user.email);
            }

            res.render('view-contacts', { contacts: contactUsers, sessionId });
        } else {
            res.redirect('/login?message=Please log in to view contacts');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Handle blocking and unblocking users
app.get('/block-user', async (req, res) => {
    try {
        const { email, sessionId } = req.query;
        const user = await getUserBySession(sessionId);
        if (user) {
            await blockUser(user.email, email);
            res.redirect('/view-contacts?sessionId=' + sessionId);
        } else {
            res.redirect('/login?message=Please log in to block users');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Handle blocking and unblocking users
app.get('/unblock-user', async (req, res) => {
    try {
        const { email, sessionId } = req.query;
        const user = await getUserBySession(sessionId);
        if (user) {
            await unblockUser(user.email, email);
            res.redirect('/view-contacts?sessionId=' + sessionId);
        } else {
            res.redirect('/login?message=Please log in to unblock users');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});


// Handle viewing profiles
app.get('/profile', async (req, res) => {
    try {
        const { email, sessionId } = req.query;
        const viewer = await getUserBySession(sessionId);
        if (viewer) {
            const blocked = await isUserBlocked(viewer.email, email);
            if (blocked) {
                res.status(403).send('You are blocked from viewing this profile.');
            } else {
                const userCollection = await getUserCollection();
                const profileUser = await userCollection.findOne({ email });
                res.render('profile', { user: profileUser });
            }
        } else {
            res.redirect('/login?message=Please log in to view profiles');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Handle viewing messages
app.get('/chat', async (req, res) => {
    try {
        const { sessionId, email } = req.query;
        const user = await getUserBySession(sessionId);
        if (user) {
            const messages = await getMessages(user.email, email);
            res.render('chat', { messages, sessionId, userEmail: user.email, receiverEmail: email });
        } else {
            res.redirect('/login?message=Please log in to view messages');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Handle sending messages
app.post('/send-message', async (req, res) => {
    try {
        const { sessionId, receiverEmail, message } = req.body;
        const user = await getUserBySession(sessionId);
        if (user) {
            await sendMessage(user.email, receiverEmail, message);
            res.redirect(`/chat?sessionId=${sessionId}&email=${receiverEmail}`);
        } else {
            res.redirect('/login?message=Please log in to send messages');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});