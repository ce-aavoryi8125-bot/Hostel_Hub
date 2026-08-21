const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return transporter;
}

/**
 * Send Password Reset Email with Clickable Action Link & OTP Code
 */
async function sendPasswordResetEmail({ toEmail, name, resetLink, otpCode }) {
  const mailTransporter = getTransporter();

  const recipientName = name || 'Student';
  const subject = '🔒 Reset Your Hostel Hub Password';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
        .container { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { display: inline-block; font-size: 22px; font-weight: 800; color: #ffffff; text-decoration: none; margin-bottom: 24px; }
        .logo span { color: #818cf8; }
        h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px 0; }
        .btn-box { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
        .code-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0; }
        .code-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .code-val { font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #818cf8; font-family: monospace; }
        .footer { font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">🏠 Hostel<span>Hub</span></a>
        <h1>Password Reset Request</h1>
        <p>Hello ${recipientName},</p>
        <p>We received a request to reset your password for your <strong>Hostel Hub</strong> account. Click the button below to set a new password:</p>
        
        <div class="btn-box">
          <a href="${resetLink}" class="btn" target="_blank">Reset My Password →</a>
        </div>

        <div class="code-box">
          <div class="code-label">Or Enter This Verification Code</div>
          <div class="code-val">${otpCode}</div>
        </div>

        <p style="font-size: 13px; color: #94a3b8;">This code and link are valid for 15 minutes. If you did not make this request, you can safely ignore this email.</p>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} Hostel Hub &bull; Tarkwa, Ghana
        </div>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL NOTICE] No SMTP credentials in .env!`);
    console.log(`Recipient: ${toEmail}`);
    console.log(`Reset Code: ${otpCode}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`To send real emails to inboxes, add SMTP_USER & SMTP_PASS in .env`);
    console.log(`======================================================\n`);
    return { sent: false, reason: 'no_smtp_configured' };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: `"Hostel Hub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log(`✅ [MAILER] Password reset email sent to ${toEmail} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [MAILER] Failed to send email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
