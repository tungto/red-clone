'use strict';
const nodemailer = require('nodemailer');

export interface INodeMailerInfo {
	from: string;
	to: string;
	subject: string;
	text?: string;
	html: string;
}

// async..await is not allowed in global scope, must use a wrapper
async function sendEmail(emailInfo: INodeMailerInfo) {
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: 2525,
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD,
		},
		secure: false,
	});

	// send mail with defined transport object
	const info = await transporter.sendMail(emailInfo);

	console.log('Message sent: %s', info.messageId);
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	//
	// NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
	//       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
	//       <https://github.com/forwardemail/preview-email>
	//
}

export default sendEmail;
