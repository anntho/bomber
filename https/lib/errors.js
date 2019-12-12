const createError = require('http-errors');
const { sendEmail } = require('./email');
const fs = require('fs');

module.exports = {
	catch404: (req, res, next) => {
		console.log(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
		next(createError(404));
	},
	errorHandler: (err, req, res, next) => {
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};

		// console.log('error handler');
		// console.log(1, res.locals.message);
		// console.log(2, res.locals.error.status);
		// console.log(3, res.locals.error.stack);

		if (err.status == 404) {
			res.render('404');
		} else {
			res.status(err.status || 500);
			res.render('error');
		}
	},
	reportError: async (file, line, err, email) => {
		const reportEmail = 'anthony@moviebomber.org';
		let content = '';
		content += '<p>Error Report</p>';
		content += `<p>Env: ${process.env.NODE_ENV} | File: ${file} | Line: ${line}</p>`;
		content += err;

		console.log(file, line);
		console.log(err);

		if (email) {
			await sendEmail(
				reportEmail,
				`Error`,
				content
			);
		}
	}
}