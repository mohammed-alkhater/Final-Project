const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const { registerUser, loginUser, getUserBySession, verifyEmail, deleteSession } = require('./business');
const crypto = require('crypto');

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/uploads', express.static('uploads'));

// Set up view engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');


app.get('/register', (req, res) => {
    res.render('register', { message: req.query.message });
});
// Middleware to handle flash messages using session
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, fluentLanguages, learningLanguages } = req.body;
        let photo = null;

        if (req.files && req.files.photo) {
            const photoFile = req.files.photo;
            const uploadPath = 'uploads/' + photoFile.name;
            await photoFile.mv(uploadPath);
            photo = uploadPath;
        }

        await registerUser(name, email, password, fluentLanguages, learningLanguages, photo);

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

app.get('/dashboard', async (req, res) => {
    try {
        const sessionId = req.query.sessionId;
        console.log(`Dashboard accessed with session ID: ${sessionId}`);
        // Check if the session ID is valid
        const user = await getUserBySession(sessionId);
        console.log(`User found: ${JSON.stringify(user)}`);

        if (user) {
            res.render('dashboard', { name: user.name, photo: user.photo, sessionId });
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

app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    verifyEmail(token);
    console.log(`Verifying email with token: ${token}`);
    res.render('verify-email', { token });
});

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

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
