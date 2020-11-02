// Constructs a date object required for the Library API.
// Undefined parameters are not set in the date object, which the API sees as a
// wildcard.
function constructDate(year, month, day) {
	const date = {};
	if (year) date.year = year;
	if (month) date.month = month;
	if (day) date.day = day;
	return date;
}

// Responds with an error status code and the encapsulated data.error.
function returnError(res, data) {
	// Return the same status code that was returned in the error or use 500
	// otherwise.
	const statusCode = data.error.code || 500;
	// Return the error.
	res.status(statusCode).send(data.error);
}

module.exports = {
	constructDate,
	returnError,
};
