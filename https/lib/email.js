module.exports = {
	sendEmail: async (to, subject, text) => {
		console.log(`new email [${to}]`);
		const config = require('../bin/config');
		const nodemailer = require('nodemailer');
		const { google } = require('googleapis');
		const OAuth2 = google.auth.OAuth2;

		const oauth2Client = new OAuth2(
			config.google.clientId,
			config.google.clientSecret,
			'https://developers.google.com/oauthplayground'
		);

		oauth2Client.setCredentials({
			refresh_token: config.google.refreshToken
		});

		const tokens = await oauth2Client.refreshAccessToken();
		const accessToken = tokens.credentials.access_token;

		const smtpTransport = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				type: 'OAuth2',
				user: config.google.email, 
				clientId: config.google.clientId,
				clientSecret: config.google.clientSecret,
				refreshToken: config.google.refreshToken,
				accessToken: accessToken
			}
		});

		const mailOptions = {
			from: `The moviebomber.org Team <${config.google.email}>`,
			to: to,
			subject: subject,
			generateTextFromHTML: true,
			html: text
		};

		smtpTransport.sendMail(mailOptions, (err, response) => {
			if (err) {
				throw err;
			} else {
				//console.log(response);
				smtpTransport.close();
			}
		});
	}
}