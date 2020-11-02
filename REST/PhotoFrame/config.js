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

// This file contains the configuration options for this sample app.
const secrets = require('./secrets.js');
const config = {};

// The OAuth client ID from the Google Developers console.
config.oAuthClientID = secrets.oAuthClientID;

// The OAuth client secret from the Google Developers console.
config.oAuthclientSecret = secrets.oAuthclientSecret;

// The callback to use for OAuth requests. This is the URL where the app is
// running. For testing and running it locally, use 127.0.0.1.
config.oAuthCallbackUrl = secrets.oAuthCallbackUrl;

config.APIKey = secrets.APIKey;

// The port where the app should listen for requests.
config.port = 8080;

// The scopes to request. The app requires the photoslibrary.readonly and
// plus.me scopes.
config.scopes = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'profile',
  // 'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.metadata',
  // 'https://www.googleapis.com/auth/drive.file',
];

// The number of photos to load for search requests.
config.photosToLoad = 150;

// The page size to use for search requests. 100 is reccommended.
config.searchPageSize = 100;

// The page size to use for the listing albums request. 50 is reccommended.
config.albumPageSize = 50;

// The API end point to use. Do not change.
config.apiEndpoint = 'https://photoslibrary.googleapis.com';

config.driveApiEndpoint = 'https://www.googleapis.com/';
module.exports = config;
