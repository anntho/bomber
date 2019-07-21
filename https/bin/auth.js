module.exports.authenticated = (req, res, next) => {
	if (req.session.user) {
		next();
	} else {
		req.flash('error_msg', 'Please login to continue');
		res.redirect('/login');
	}
}