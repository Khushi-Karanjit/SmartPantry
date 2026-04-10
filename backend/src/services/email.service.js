const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Reusable utility to send emails using Gmail SMTP
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"SmartPantry 🥘" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EmailService] Error sending email to ${to}:`, error);
    throw error;
  }
};

module.exports = { sendEmail };
