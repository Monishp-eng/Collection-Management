const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const nodemailer = require('nodemailer');

async function runTest() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.error('SMTP_HOST and SMTP_USER must be set in .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('SMTP connection verified');

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Finance Collection - SMTP Test',
      text: 'This is a test email sent from the Finance Collection test script.',
    });

    console.log('Test email sent, messageId:', info.messageId);
  } catch (err) {
    console.error('Failed to send test email:', err);
    process.exitCode = 1;
  }
}

runTest();
