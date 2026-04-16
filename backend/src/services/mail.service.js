const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a generic email
 */
async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"SmartPantry Notifications" <noreply@smartpantry.com>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Send a notification alert email
 */
async function sendAlertEmail(user, alerts) {
  const alertListHtml = alerts
    .map(
      (a) =>
        `<li style="color: ${a.priority === "high" ? "#ef4444" : "#f59e0b"};">
          <strong>${a.title}</strong>: ${a.message}
        </li>`
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #6366f1;">Smart Pantry Status</h2>
      <p style="color: #64748b;">Hi ${user.username},</p>
      <p>The system has identified items in your pantry that require immediate attention:</p>
      <ul>${alertListHtml}</ul>
      <p style="margin-top: 24px;">Please review your dashboard for comprehensive inventory management.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="font-size: 0.8rem; color: #64748b;">Automated Status Update • SmartPantry Intelligent Systems</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Smart Pantry Status: Action Required`,
    html,
  });
}

module.exports = {
  sendEmail,
  sendAlertEmail,
};
