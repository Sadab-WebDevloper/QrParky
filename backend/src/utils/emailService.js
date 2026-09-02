const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('./logger');

let transporter = null;

const getTransporter = () => {
  if (!transporter && config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
};

/**
 * Common sender helper
 */
const sendMail = async ({ to, subject, html, text }) => {
  try {
    const activeTransporter = getTransporter();

    if (activeTransporter) {
      const info = await activeTransporter.sendMail({
        from: config.email.from,
        to,
        subject,
        text,
        html,
      });
      logger.info(`📧 Email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } else {
      logger.info('================================================================');
      logger.info(`📧 [DEV EMAIL SIMULATION] To: ${to}`);
      logger.info(`   Subject: ${subject}`);
      logger.info(`   Content Preview: \n${text || 'HTML Content'}`);
      logger.info('   (Configure SMTP_USER & SMTP_PASS in backend/.env for real email dispatch)');
      logger.info('================================================================');
      return { sent: true, simulated: true };
    }
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
    return { sent: false, error: error.message };
  }
};

/**
 * Common Luxury Email Layout Wrapper
 */
const renderEmailLayout = ({ preheader, title, badge, content }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf9f6; color: #1c1917; }
        .wrapper { width: 100%; background-color: #faf9f6; padding: 40px 15px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; border: 1px solid #f3eedf; box-shadow: 0 10px 35px -8px rgba(217, 119, 6, 0.12); overflow: hidden; }
        .header { background: linear-gradient(180deg, #fffcf5 0%, #ffffff 100%); padding: 32px 30px 24px; text-align: center; border-bottom: 1px solid #f7eed7; }
        .logo-badge { display: inline-block; width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); line-height: 44px; text-align: center; font-size: 22px; margin-bottom: 10px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
        .brand-name { font-size: 24px; font-weight: 900; color: #1c1917; letter-spacing: -0.5px; margin: 0; }
        .brand-subtitle { font-size: 12px; color: #a87919; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
        .body-content { padding: 32px 30px; }
        .alert-box { background-color: #fffdf7; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 10px; margin-bottom: 24px; }
        .btn-gold { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000 !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 6px 20px -4px rgba(245, 158, 11, 0.4); text-align: center; }
        .info-card { background-color: #faf8f2; border: 1px solid #ede3cf; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
        .info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .info-table td { padding: 7px 0; }
        .info-label { color: #78716c; font-weight: 600; width: 140px; }
        .info-value { color: #1c1917; font-weight: 700; }
        .footer { background-color: #fdfcf9; border-top: 1px solid #f3eedf; padding: 22px 30px; text-align: center; font-size: 12px; color: #a8a29e; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          
          <!-- Header -->
          <div class="header">
            <div class="logo-badge">🛡️</div>
            <h1 class="brand-name">QrParky</h1>
            <div class="brand-subtitle">Smart Society Vehicle & Access Management</div>
          </div>

          <!-- Body Content -->
          <div class="body-content">
            ${content}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; color: #78716c; font-weight: 600;">QrParky • Bank-Grade Encrypted Gate Access</p>
            <p style="margin: 0; font-size: 11px;">© ${new Date().getFullYear()} QrParky Platform. All rights reserved.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * 1. Society Application Submitted / Received
 */
const sendSocietyApplicationReceivedEmail = async ({ applicantEmail, applicantName, societyName, address }) => {
  const subject = `QrParky — Application Received for ${societyName}`;
  const text = `Hello ${applicantName},\n\nWe have received your society onboarding application for "${societyName}" (${address}).\n\nYour application is currently under review by our Super Admin team. Once approved, you will receive an email with your Society Admin login credentials and Member onboarding invite link.\n\nThank you,\nTeam QrParky`;
  
  const content = `
    <div class="alert-box">
      <div style="font-size: 15px; font-weight: 800; color: #b45309; margin-bottom: 4px;">Application Received 📋</div>
      <div style="font-size: 13px; color: #57534e; line-height: 1.5;">
        Hello <strong>${applicantName}</strong>, your onboarding application for <strong>${societyName}</strong> is submitted and is being processed.
      </div>
    </div>

    <div class="info-card">
      <table class="info-table">
        <tr>
          <td class="info-label">Society Name:</td>
          <td class="info-value">${societyName}</td>
        </tr>
        <tr>
          <td class="info-label">Address:</td>
          <td class="info-value" style="font-weight: 500;">${address}</td>
        </tr>
        <tr>
          <td class="info-label">Current Status:</td>
          <td><span style="background-color: #fef3c7; color: #b45309; padding: 3px 10px; border-radius: 20px; font-weight: 800; font-size: 11px; text-transform: uppercase;">Under Super Admin Review</span></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #57534e; line-height: 1.6; margin: 0 0 16px 0;">
      Our verification team will review your society application shortly. Once approved, temporary Society Administrator credentials will be dispatched directly to your inbox.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    content,
  });

  return sendMail({ to: applicantEmail, subject, text, html });
};

/**
 * 2. Society Application Approved (With Credentials & Invite Link)
 */
const sendSocietyApprovedEmail = async ({ applicantEmail, applicantName, societyName, loginEmail, temporaryPassword, inviteLinkToken }) => {
  const loginUrl = `${config.frontendUrl}/login`;
  const inviteUrl = `${config.frontendUrl}/register/${inviteLinkToken}`;

  const subject = `🎉 Congratulations! "${societyName}" Approved - QrParky Admin Access`;
  const text = `Hello ${applicantName},\n\nGreat news! Your society "${societyName}" has been APPROVED on QrParky.\n\nYOUR SOCIETY ADMIN LOGIN CREDENTIALS:\nLogin URL: ${loginUrl}\nEmail: ${loginEmail}\nPassword: ${temporaryPassword}\n\nSOCIETY MEMBER INVITE LINK (Share with residents):\n${inviteUrl}\n\nPlease login and change your password in the dashboard.\n\nThank you,\nTeam QrParky`;

  const content = `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 10px; margin-bottom: 24px;">
      <div style="font-size: 15px; font-weight: 800; color: #15803d; margin-bottom: 4px;">🎉 Application Approved!</div>
      <div style="font-size: 13px; color: #166534; line-height: 1.5;">
        Hello <strong>${applicantName}</strong>, your society <strong>${societyName}</strong> has been officially approved. Your administrative portal is ready.
      </div>
    </div>

    <!-- Credentials Box -->
    <div style="background: linear-gradient(135deg, #fffdf8 0%, #faf6ec 100%); border: 1px solid #fde68a; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
        🔑 Society Admin Login Credentials
      </div>
      <table class="info-table">
        <tr>
          <td class="info-label">Portal URL:</td>
          <td class="info-value"><a href="${loginUrl}" style="color: #d97706; text-decoration: underline;">${loginUrl}</a></td>
        </tr>
        <tr>
          <td class="info-label">Admin Email:</td>
          <td class="info-value">${loginEmail}</td>
        </tr>
        <tr>
          <td class="info-label">Temporary Password:</td>
          <td class="info-value" style="font-family: monospace; font-size: 15px; color: #b45309; background-color: #fff; padding: 2px 8px; border-radius: 6px; border: 1px solid #fde68a; display: inline-block;">${temporaryPassword}</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${loginUrl}" class="btn-gold">
          Sign In to Society Dashboard →
        </a>
      </div>
    </div>

    <!-- Resident Invite Link Box -->
    <div style="background-color: #faf8f2; border: 1px dashed #d6cbaf; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 800; color: #1c1917; margin-bottom: 4px;">🔗 Resident Onboarding Link</div>
      <p style="font-size: 12px; color: #78716c; margin: 0 0 10px 0;">Share this link in your society WhatsApp groups for resident vehicle pass registration:</p>
      <div style="background-color: #ffffff; border: 1px solid #ede3cf; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #b45309; word-break: break-all;">
        ${inviteUrl}
      </div>
    </div>
  `;

  const html = renderEmailLayout({
    title: subject,
    content,
  });

  return sendMail({ to: applicantEmail, subject, text, html });
};

/**
 * 3. Society Application Rejected
 */
const sendSocietyRejectedEmail = async ({ applicantEmail, applicantName, societyName, reason }) => {
  const subject = `Update regarding your Society Application for ${societyName} - QrParky`;
  const text = `Hello ${applicantName},\n\nThank you for your interest in QrParky. After reviewing your application for "${societyName}", our team was unable to approve it at this time.\n\nReason: ${reason || 'Application criteria not met'}\n\nPlease contact support or re-apply with valid details.\n\nThank you,\nTeam QrParky`;

  const content = `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 10px; margin-bottom: 24px;">
      <div style="font-size: 15px; font-weight: 800; color: #b91c1c; margin-bottom: 4px;">Application Status Update</div>
      <div style="font-size: 13px; color: #991b1b; line-height: 1.5;">
        Hello <strong>${applicantName}</strong>, your onboarding request for <strong>${societyName}</strong> could not be approved at this time.
      </div>
    </div>

    ${reason ? `
    <div class="info-card">
      <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; margin-bottom: 4px;">Reason Provided:</div>
      <div style="font-size: 13px; color: #1c1917; font-weight: 600;">${reason}</div>
    </div>
    ` : ''}

    <p style="font-size: 13px; color: #57534e; line-height: 1.6; margin: 0;">
      If you feel this decision was in error or you have updated society registration documents, you are welcome to submit a new application on our portal.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    content,
  });

  return sendMail({ to: applicantEmail, subject, text, html });
};

module.exports = {
  sendSocietyApplicationReceivedEmail,
  sendSocietyApprovedEmail,
  sendSocietyRejectedEmail,
};
