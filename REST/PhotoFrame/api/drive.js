const { google } = require('googleapis');
const request = require('request-promise');
const { returnError } = require('../utils');
const { getOAuthClient } = require('./auth');


function driveApi(app, logger, config) {
	const OAuthClient = getOAuthClient(config);
	const drive = google.drive({ version: 'v3' });
	// google.options({
	// 	auth: OAuthClient,
	// });
	// Returns all albums owned by the user.
	app.get('/getSharedFolders', async (req, res) => {
		if (!req.user || !req.isAuthenticated()) {
			returnError(res, {
				error: {
					code: 401,
					message: 'User not logged in',
				},
			});

			return;
		}
		const parent = req.query.parent;// || '1VLsazmJPa7Xqr5g-mgnbCkWXQQ4Bvut1';
		const searchParameters = {
			parent,
		}
		console.log("Searching folders", searchParameters, req.query );
		const parentFilter = parent ? `('${parent}' in parents)`: 'sharedWithMe=true';
		const targetUrl = config.driveApiEndpoint + 'drive/v3/files';

		const parameters = {
			pageSize: 10,
			q:
				`mimeType = 'application/vnd.google-apps.folder'${parentFilter ? ` and ${parentFilter}` : ''}`,
			includeItemsFromAllDrives: true,
			supportsAllDrives: true,
			fields: 'nextPageToken, files(id, name, kind, parents)',
		};
		let result = [];
		let error = null;
		try {
			result = await request.get(targetUrl, {
				// headers: { 'Content-Type': 'application/json' },
				qs: parameters,
				auth: { bearer: req.user.token },
			});
		} catch (err) {
			error = err;
		}
		returnFolders(res, { folders: result, error }, searchParameters);
	});
}
function returnFolders(res, data, searchParameters) {
	if (data.error) {
		returnError(res, data);
	} else {
		// Remove the pageToken and pageSize from the search parameters.
		// They will be set again when the request is submitted but don't need to be
		// stored.
		// delete searchParameter.pageToken;
		// delete searchParameter.pageSize;

		// Cache the media items that were loaded temporarily.
		// mediaItemCache.setItemSync(userId, data.photos);
		// Store the parameters that were used to load these images. They are used
		// to resubmit the query after the cache expires.
		// storage.setItemSync(userId, { parameters: searchParameter });

		// Return the photos and parameters back int the response.
		res
			.status(200)
			.send({ folders: JSON.parse(data.folders).files, parameters: searchParameters });
	}
}
module.exports = {
	driveApi,
};
