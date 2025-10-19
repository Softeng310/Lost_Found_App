const nodemailer = require('nodemailer');

// Create a reusable transporter object using SMTP transport if env vars are present
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return null;
}

const transporter = createTransporter();

/**
 * Send a verification code email.
 * In development (or when SMTP is not configured), this will log the email to console instead.
 * @param {string} toEmail - Recipient email address
 * @param {string} code - Verification code
 * @param {object} options - Additional options
 */
async function sendVerificationCodeEmail(toEmail, code, options = {}) {
  const from = process.env.FROM_EMAIL || 'no-reply@lost-found.local';
  const subject = options.subject || 'Your verification code';
  const appName = options.appName || 'Lost & Found';

  const text = `Hello,

Your ${appName} verification code is: ${code}
This code will expire in 10 minutes.

If you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin:0 0 12px;">${appName} Verification</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p style="color:#6b7280;">This code will expire in 10 minutes.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="font-size:12px;color:#6b7280;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  if (!transporter) {
    console.log('Email transport not configured. Would send email:', { toEmail, subject, text });
    return { mocked: true };
  }

  const info = await transporter.sendMail({ from, to: toEmail, subject, text, html });
  return info;
}

module.exports = { sendVerificationCodeEmail };
