// Load dependencies
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');

// Load configuration from .env file
require('dotenv').config();

// Load and initialize MesageBird SDK
var messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);

// Set up and configure the Express framework
var app = express();
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended : true }));

// Start of security process: capture number
app.get('/', function(req, res) {
    res.render('start.handlebars');
});

app.post('/verify', function(req, res) {
    // Compose number from country code and number
    var number = req.body.country_code
        + (req.body.phone_number[0] == '0'
            ? req.body.phone_number.substring(1)
            : req.body.phone_number);
    
    // Create verification request with MessageBird Verify API
    messagebird.verify.create(number, {
        type : 'tts', // TTS = text-to-speech, otherwise API defaults to SMS
        template : "Your account security code is %token."
    }, function(err, response) {
        if (err) {
            // Something went wrong
            console.log(err);
            res.render('start.handlebars',
                { error : "Could not initiate call." });
        } else {
            // API request was successful, call is on its way
            console.log(response);
            res.render('verify.handlebars', {
                id : response.id // We need this ID to confirm verification.
            });
        }
    });
});

app.post('/confirm', function(req, res) {
    // Complete verification request with MessageBird Verify API
    messagebird.verify.verify(req.body.id, req.body.token,
        function(err, response) {
            if (err) {
                // Something went wrong
                console.log(err);
                res.render('start.handlebars',
                    { error : "Verification has failed. Please try again." });
            } else {
                // Confirmation was successful
                console.log(response);
                res.render('confirm.handlebars');
            }
        });
});

app.listen(8080);