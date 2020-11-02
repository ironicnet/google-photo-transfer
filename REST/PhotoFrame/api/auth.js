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
const { google } = require('googleapis');
const passport = require('passport');

const GoogleOAuthStrategy = require('passport-google-oauth20').Strategy;

let oauth2Client = null
function getOAuthClient(config) {
	oauth2Client = oauth2Client || new google.auth.OAuth2(
		config.oAuthClientID,
		config.oAuthclientSecret,
		config.oAuthCallbackUrl,
	);

	return oauth2Client;
}

function authenticate(config) {
	google.options({auth: getOAuthClient(config)});

	passport.serializeUser((user, done) => done(null, user));
	passport.deserializeUser((user, done) => done(null, user));
	passport.use(
		new GoogleOAuthStrategy(
			{
				clientID: config.oAuthClientID,
				clientSecret: config.oAuthclientSecret,
				callbackURL: config.oAuthCallbackUrl,
				// Set the correct profile URL that does not require any additional APIs
				userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
			},
			(token, refreshToken, profile, done) => {
				oauth2Client.credentials = token;
				console.log('setting credentials', oauth2Client.credentials, token);
				return done(null, { profile, token })
			},
		),
	);
}

function authApi(app, logger, config) {
	console.log('authenticating');
	authenticate(config);
	// Set up passport and session handling.
	app.use(passport.initialize());
	app.use(passport.session());

	// GET request to log out the user.
	// Destroy the current session and redirect back to the log in screen.
	app.get('/logout', (req, res) => {
		req.logout();
		req.session.destroy();
		res.redirect('/');
	});

	// Star the OAuth login process for Google.
	app.get(
		'/auth/google',
		passport.authenticate('google', {
			scope: config.scopes,
			failureFlash: true, // Display errors to the user.
			session: true,
		}),
	);

	// Callback receiver for the OAuth process after log in.
	app.get(
		'/auth/google/callback',
		passport.authenticate('google', {
			failureRedirect: '/',
			failureFlash: true,
			session: true,
		}),
		(req, res) => {
			// User has logged in.
			logger.info('User has logged in.', res);
			res.redirect('/');
		},
	);
}

module.exports = {
	authApi,
	authenticate,
	getOAuthClient,
};
