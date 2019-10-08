const { updateSessionHTTP } = require('../lib/updateSession');

module.exports.authenticated = async (req, res, next) => {
	if (req.session.user) {
		await updateSessionHTTP(req);
		next();
	} else {
		req.flash('error_msg', 'Please login to continue');
		res.redirect('/login');
	}
}

module.exports.setUser = (req, res, next) => {
	if (req.session.user) {
		res.locals.user = true;
		res.locals.username = req.session.user.username;
		res.locals.userId = req.session.user.id;
		res.locals.email = req.session.user.email;
		res.locals.name = req.session.user.name;
	}
	next();
}