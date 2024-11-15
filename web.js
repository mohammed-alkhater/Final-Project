const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const { registerUser, loginUser, getUserBySession } = require('./business');
const { getSessionCollection } = require('./persistence'); // Import session handling
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

// Middleware to handle flash messages using session
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, fluentLanguages, learningLanguages } = req.body;
        let photo = null;

        if (req.files && req.files.photo) {
            const photoFile = req.files.photo;
            const uploadPath = __dirname + '/uploads/' + photoFile.name;
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
        const sessionId = await loginUser(email, password);

        if (sessionId) {
            // Set session ID in a cookie
            res.cookie('sessionId', sessionId, { httpOnly: true });
            res.redirect('/dashboard');
        } else {
            res.redirect('/login?message=Invalid email or password');
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

app.get('/dashboard', async (req, res) => {
    try {
        const sessionId = req.query.sessionId;
        // Check if the session ID is valid
        const user = await getUserBySession(sessionId);

        if (user) {
            res.render('dashboard', { name: user.name, photo: user.photo });
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


// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
