const nodemailer = require('nodemailer');

/**
 * Email Service for sending transactional emails
 * Supports Gmail, SendGrid, Mailgun, and other SMTP services
 */

// Create reusable transporter (cached after first use)
let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USERNAME, and EMAIL_PASSWORD in .env');
    return null;
  }

  transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  return transporter;
}

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset JWT token
 * @returns {Promise<boolean>} - True if email sent successfully
 */
async function sendPasswordResetEmail(email, resetToken) {
  const transport = getTransporter();
  
  if (!transport) {
    console.warn('Email service not configured. Password reset email not sent.');
    return false;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Password Reset Request - Drose Online',
    html: getPasswordResetTemplate(resetLink)
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    return false;
  }
}

/**
 * HTML template for password reset email
 */
function getPasswordResetTemplate(resetLink) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #3b82f6;
      margin: 0;
      font-size: 28px;
    }
    .content {
      background-color: white;
      padding: 25px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .link-text {
      word-break: break-all;
      background-color: #f3f4f6;
      padding: 10px;
      border-radius: 4px;
      font-size: 13px;
      color: #6b7280;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Drose Online</h1>
      <p>Educational Management System</p>
    </div>
    
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="link-text">${resetLink}</div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Drose Online. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send welcome email to new user
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @param {string} role - User's role (student, teacher, admin)
 */
async function sendWelcomeEmail(email, fullName, role) {
  const transport = getTransporter();
  
  if (!transport) {
    console.warn('Email service not configured. Welcome email not sent.');
    return false;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Welcome to Drose Online! 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to Drose Online!</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Your ${role} account has been successfully created. Welcome to our educational management platform!</p>
            <div style="text-align: center;">
              <a href="${frontendUrl}/auth/login" class="button">Login to Your Account</a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The Drose Online Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};

