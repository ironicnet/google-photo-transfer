// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// [START app]

const async = require('async');
const bodyParser = require('body-parser');
const config = require('./config.js');
const express = require('express');
const expressWinston = require('express-winston');
const http = require('http');
const persist = require('node-persist');
const request = require('request-promise');
const session = require('express-session');
const sessionFileStore = require('session-file-store');
const uuid = require('uuid');
const winston = require('winston');
const {google} = require('googleapis');

const {authApi} = require('./api/auth.js');
const {driveApi} = require('./api/drive.js');
const {photosApi} = require('./api/photos.js');

const app = express();
const fileStore = sessionFileStore(session);
const server = http.Server(app);

// Use the EJS template engine
app.set('view engine', 'ejs');


// // Set up a cache for media items that expires after 55 minutes.
// // This caches the baseUrls for media items that have been selected
// // by the user for the photo frame. They are used to display photos in
// // thumbnails and in the frame. The baseUrls are send to the frontend and
// // displayed from there. The baseUrls are cached temporarily to ensure that the
// // app is responsive and quick. Note that this data should only be stored for a
// // short amount of time and that access to the URLs expires after 60 minutes.
// // See the 'best practices' and 'acceptable use policy' in the developer
// // documentation.
// const mediaItemCache = persist.create({
//   dir: 'persist-mediaitemcache/',
//   ttl: 3300000,  // 55 minutes
// });
// mediaItemCache.init();

// // Temporarily cache a list of the albums owned by the user. This caches
// // the name and base Url of the cover image. This ensures that the app
// // is responsive when the user picks an album.
// // Loading a full list of the albums owned by the user may take multiple
// // requests. Caching this temporarily allows the user to go back to the
// // album selection screen without having to wait for the requests to
// // complete every time.
// // Note that this data is only cached temporarily as per the 'best practices' in
// // the developer documentation. Here it expires after 10 minutes.
// const albumCache = persist.create({
//   dir: 'persist-albumcache/',
//   ttl: 600000,  // 10 minutes
// });
// albumCache.init();

// // For each user, the app stores the last search parameters or album
// // they loaded into the photo frame. The next time they log in
// // (or when the cached data expires), this search is resubmitted.
// // This keeps the data fresh. Instead of storing the search parameters,
// // we could also store a list of the media item ids and refresh them,
// // but resubmitting the search query ensures that the photo frame displays
// // any new images that match the search criteria (or that have been added
// // to an album).
// const storage = persist.create({dir: 'persist-storage/'});
// storage.init();

const appStorage = persist.create({
	dir: 'persist-app-storage/'
  });
  appStorage.init();

app.storage = appStorage;

// Set up OAuth 2.0 authentication through the passport.js library.
// const passport = require('passport');
// const auth = require('./auth');
// auth(passport);

// Set up a session middleware to handle user sessions.
// NOTE: A secret is used to sign the cookie. This is just used for this sample
// app and should be changed.
const sessionMiddleware = session({
  resave: true,
  saveUninitialized: true,
  store: new fileStore({}),
  secret: 'photo transfer',
});

// Console transport for winton.
const consoleTransport = new winston.transports.Console();

// Set up winston logging.
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    consoleTransport
  ]
});

// Enable extensive logging if the DEBUG environment variable is set.
if (process.env.DEBUG) {
  // Print all winston log levels.
  logger.level = 'silly';

  // Enable express.js debugging. This logs all received requests.
  app.use(expressWinston.logger({
    transports: [
          consoleTransport
        ],
        winstonInstance: logger
  }));
  // Enable request debugging.
  require('request-promise').debug = true;
} else {
  // By default, only print all 'verbose' log level messages or below.
  logger.level = 'verbose';
}


// Set up static routes for hosted libraries.
app.use(express.static('static'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use(
    '/fancybox',
    express.static(__dirname + '/node_modules/@fancyapps/fancybox/dist/'));
app.use(
    '/mdlite',
    express.static(__dirname + '/node_modules/material-design-lite/dist/'));


// Parse application/json request data.
app.use(bodyParser.json());

// Parse application/xwww-form-urlencoded request data.
app.use(bodyParser.urlencoded({extended: true}));

// Enable user session handling.
app.use(sessionMiddleware);

authApi(app, logger, config);


// Middleware that adds the user of this session as a local variable,
// so it can be displayed on all pages when logged in.
app.use((req, res, next) => {
  res.locals.name = '-';
  if (req.user && req.user.profile && req.user.profile.name) {
    res.locals.name =
        req.user.profile.name.givenName || req.user.profile.displayName;
  }

  res.locals.avatarUrl = '';
  if (req.user && req.user.profile && req.user.profile.photos) {
    res.locals.avatarUrl = req.user.profile.photos[0].value;
  }
  next();
});
photosApi(app, logger, config);
driveApi(app, logger, config);


// GET request to the root.
// Display the login screen if the user is not logged in yet, otherwise the
// photo frame.
app.get('/', (req, res) => {
  console.log('root', req.user, req.isAuthenticated());
  if (!req.user || !req.isAuthenticated()) {
    // Not logged in yet.
    res.render('pages/login');
  } else {
    res.render('pages/frame');
  }
});
// Loads the search page if the user is authenticated.
// This page includes the search form.
app.get('/search', (req, res) => {
  renderIfAuthenticated(req, res, 'pages/search');
});

// Loads the album page if the user is authenticated.
// This page displays a list of albums owned by the user.
app.get('/album', (req, res) => {
  renderIfAuthenticated(req, res, 'pages/album');
});
// Loads the album page if the user is authenticated.
// This page displays a list of albums owned by the user.
app.get('/transfer', (req, res) => {
  renderIfAuthenticated(req, res, 'pages/transfer');
});


// Loads the album page if the user is authenticated.
// This page displays a list of albums owned by the user.
app.get('/files', (req, res) => {
  renderIfAuthenticated(req, res, 'pages/files');
});



// Start the server
server.listen(config.port, () => {
  console.log(`App listening on port http://localhost:${config.port}`);
  console.log('Press Ctrl+C to quit.');
});

// Renders the given page if the user is authenticated.
// Otherwise, redirects to "/".
function renderIfAuthenticated(req, res, page) {
  if (!req.user || !req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render(page);
  }
}


// [END app]
