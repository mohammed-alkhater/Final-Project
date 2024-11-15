const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const { registerUser } = require('./business');
const exphbs = require('express-handlebars');

const app = express();

// Setup express-handlebars as the view engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/uploads', express.static('uploads'));

// Render the registration page
app.get('/register', (req, res) => {
    res.render('register');
});

// Handle registration form submission
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
        res.redirect('/register-success');
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
});

// Success page
app.get('/register-success', (req, res) => {
    res.send('Registration successful! Please check your email for verification.');
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
