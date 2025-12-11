'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

// Extend cors to null origin for localhost testing
const corsOptions = {
  origin: function (origin, callback) {
    //console.log('origin is:',origin);
    // Check if the origin is in the allowed list or if it's 'null'
    if (origin === 'null' || !origin || allowedOrigins.includes(origin)) {
      //console.log('origin returns true');
      callback(null, true);
    } else {
      // Deny the request if the origin is not allowed
      //console.log('origin returns false');
      callback(new Error('Not allowed by CORS'), false);
    }
  }
};
// Example of an allowed origins whitelist 
const allowedOrigins = ['https://freecodecamp.org', 'http://127.0.0.1:5500', 'http://localhost:3000'];

// Apply the configured CORS middleware to all paths
//app.use(cors(corsOptions));
//app.use(cors());
//app.use(cors({ origin: ['null', '*', 'http://localhost:3000', 'http://127.0.0.1:5500'] }));


app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
