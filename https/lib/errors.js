const createError = require('http-errors');

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
	reportError: () => {
		
	}
}