const createError = require('http-errors');
const { sendEmail } = require('./email');

module.exports = {
	catch404: (req, res, next) => {
		next(createError(404));
	},
	errorHandler: (err, req, res, next) => {
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};

		if (err.status == 404) {
			res.status(404);
			res.render('404');
		} else {
			res.status(err.status || 500);
			res.render('error');
		}
	},
	reportError: async (env, file, line, err, email) => {
		const reportEmail = 'anthony@moviebomber.org';
		let content = '';
		content += '<p>moviebomber.org | Error Report: </p>';
		content += `<p>Env: ${env} | File: ${file} | Line: ${line}</p>`;
		content += err;

		if (email) {
			await sendEmail(
				reportEmail,
				`Error`,
				content
			);
		}
	}
}