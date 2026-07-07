const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email via Nodemailer.
 * To swap email providers in the future, only this file needs to change.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
    console.warn(`[Email] SMTP not configured. Skipping email to: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'AuctionHub <no-reply@auctionhub.com>',
      to,
      subject,
      html,
    });
    console.log(`[Email] Message sent: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Failed to send email to ${to}: ${err.message}`);
  }
};

module.exports = { sendEmail };
