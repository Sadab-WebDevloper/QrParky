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
 * Common Luxury Email Layout Wrapper (Gold, Ivory & Dark Neutral)
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
            <p style="margin: 0 0 6px 0; font-weight: 600; color: #78716c;">QrParky Vehicle Access Security Infrastructure</p>
            <p style="margin: 0; font-size: 11px;">This is an automated system notification. Please do not reply directly to this email.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * 1. Society Application Received (Public Onboarding)
 */
const sendSocietyApplicationReceivedEmail = async ({ applicantEmail, applicantName, societyName, address }) => {
  const subject = `Society Onboarding Application Received: ${societyName} - QrParky`;
  const text = `Hello ${applicantName},\n\nThank you for registering "${societyName}" with QrParky. We have received your society onboarding application and our team is currently verifying the details.\n\nSociety Name: ${societyName}\nAddress: ${address}\n\nOnce verified, you will receive temporary administrator credentials to manage your society gate passes.\n\nBest regards,\nTeam QrParky`;

  const content = `
    <div class="alert-box">
      <div style="font-size: 15px; font-weight: 800; color: #92400e; margin-bottom: 4px;">Application Under Verification</div>
      <div style="font-size: 13px; color: #78350f; line-height: 1.5;">
        Thank you <strong>${applicantName}</strong>! Your society onboarding request has been successfully submitted and is under verification by our security team.
      </div>
    </div>

    <div class="info-card">
      <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Application Summary
      </div>
      <table class="info-table">
        <tr>
          <td class="info-label">Society Name:</td>
          <td class="info-value">${societyName}</td>
        </tr>
        <tr>
          <td class="info-label">Physical Address:</td>
          <td class="info-value">${address}</td>
        </tr>
        <tr>
          <td class="info-label">Administrator:</td>
          <td class="info-value">${applicantName} (${applicantEmail})</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #57534e; line-height: 1.6; margin: 0;">
      Upon approval, you will receive an official activation email containing your administrative credentials and unique member invite link.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    content,
  });

  return sendMail({ to: applicantEmail, subject, text, html });
};

/**
 * 2. Society Approved + Credentials Generated
 */
const sendSocietyApprovedEmail = async ({
  applicantEmail,
  applicantName,
  societyName,
  loginEmail,
  temporaryPassword,
  inviteLinkToken,
}) => {
  const loginUrl = `${config.frontendUrl}/login`;
  const inviteUrl = `${config.frontendUrl}/register/${inviteLinkToken}`;
  const subject = `🎉 Approved! Society Portal Credentials for ${societyName} - QrParky`;
  const text = `Hello ${applicantName},\n\nCongratulations! Your housing society "${societyName}" has been approved on QrParky.\n\nLogin URL: ${loginUrl}\nEmail: ${loginEmail}\nTemporary Password: ${temporaryPassword}\n\nResident Invite Link: ${inviteUrl}\n\nPlease sign in and share the invite link with your society members.\n\nTeam QrParky`;

  const content = `
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 10px; margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: 800; color: #065f46; margin-bottom: 4px;">🎉 Society Approved & Activated!</div>
      <div style="font-size: 13px; color: #047857; line-height: 1.5;">
        Congratulations <strong>${applicantName}</strong>! Your society <strong>${societyName}</strong> has been approved. Your administrative portal is now ready.
      </div>
    </div>

    <!-- Credentials Card -->
    <div class="info-card">
      <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        🔑 Administrator Login Credentials
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

/**
 * 4. Super Admin Notification: Member Selected / Paid for Professional (Premium ₹499) Pass
 */
const sendPremiumPassNotificationToSuperAdmin = async ({
  superAdminEmail = 'superadmin@qrparky.com',
  societyName,
  memberName,
  memberEmail,
  memberPhone,
  vehicleNumber,
  vehicleType,
  fee = '₹499',
  status = 'Approved / Awaiting Fulfillment',
}) => {
  const subject = `👑 New Professional Pass (₹499): ${vehicleNumber} - ${societyName}`;
  const text = `Super Admin Alert:\n\nA new Professional / Premium Pass (₹499) has been selected/ordered!\n\nSociety: ${societyName}\nMember: ${memberName} (${memberEmail} | ${memberPhone})\nVehicle: ${vehicleNumber} (${vehicleType})\nFee: ${fee}\nStatus: ${status}\n\nPlease check the Super Admin dashboard for fulfillment.`;

  const content = `
    <div style="background-color: #fffdf5; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 10px; margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: 800; color: #92400e; margin-bottom: 4px;">👑 Premium Pass Request Notification</div>
      <div style="font-size: 13px; color: #78350f; line-height: 1.5;">
        A resident has registered / paid for a <strong>Professional Holographic Windshield Pass (₹499)</strong>.
      </div>
    </div>

    <div class="info-card">
      <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Pass & Vehicle Details
      </div>
      <table class="info-table">
        <tr>
          <td class="info-label">Society:</td>
          <td class="info-value">${societyName}</td>
        </tr>
        <tr>
          <td class="info-label">Vehicle Plate:</td>
          <td class="info-value" style="font-family: monospace; font-size: 15px; color: #b45309;">${vehicleNumber}</td>
        </tr>
        <tr>
          <td class="info-label">Vehicle Category:</td>
          <td class="info-value" style="text-transform: capitalize;">${vehicleType}</td>
        </tr>
        <tr>
          <td class="info-label">Pass Tier & Fee:</td>
          <td class="info-value" style="color: #d97706; font-weight: 800;">💎 Professional Pass (${fee})</td>
        </tr>
        <tr>
          <td class="info-label">Resident Member:</td>
          <td class="info-value">${memberName}</td>
        </tr>
        <tr>
          <td class="info-label">Contact:</td>
          <td class="info-value">${memberEmail} | ${memberPhone || 'N/A'}</td>
        </tr>
        <tr>
          <td class="info-label">Status:</td>
          <td class="info-value">${status}</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${config.frontendUrl}/admin/dashboard" class="btn-gold">
          Open Super Admin Portal →
        </a>
      </div>
    </div>
  `;

  const html = renderEmailLayout({
    title: subject,
    content,
  });

  return sendMail({ to: superAdminEmail, subject, text, html });
};

/**
 * 5. Password Reset Request Email
 */
const sendPasswordResetEmail = async ({ userEmail, userName, resetToken }) => {
  const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
  const subject = '🔒 QrParky — Password Reset Request';
  const text = `Hello ${userName},\n\nA password reset request was made for your QrParky account.\nClick the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 800; color: #1c1917; margin: 0 0 12px;">Reset Your Account Password</h2>
    <p style="font-size: 14px; color: #57534e; line-height: 1.6; margin: 0 0 20px;">
      Hello <strong>${userName}</strong>, we received a request to reset the password associated with your account (<strong>${userEmail}</strong>).
    </p>

    <div class="alert-box" style="border-left-color: #d97706;">
      <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
        ⏱️ This password reset link is time-sensitive and expires in <strong>60 minutes</strong>.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="btn-gold" style="padding: 14px 32px; font-size: 15px;">
        Reset Account Password →
      </a>
    </div>

    <p style="font-size: 12px; color: #78716c; line-height: 1.5; margin: 24px 0 0; border-top: 1px solid #f3eedf; pt: 16px;">
      If button doesn't work, copy and paste this link into your browser:<br />
      <span style="font-family: monospace; color: #b45309; word-break: break-all;">${resetUrl}</span>
    </p>
    <p style="font-size: 12px; color: #a8a29e; margin-top: 12px;">
      If you did not request a password reset, you can safely ignore this email. Your current password remains secure.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    content,
  });

  return sendMail({ to: userEmail, subject, text, html });
};

module.exports = {
  sendSocietyApplicationReceivedEmail,
  sendSocietyApprovedEmail,
  sendSocietyRejectedEmail,
  sendPremiumPassNotificationToSuperAdmin,
  sendPasswordResetEmail,
};
