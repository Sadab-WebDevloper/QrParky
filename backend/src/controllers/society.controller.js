const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, Society, User, SupportInquiry } = require('../models');
const { generateRandomToken } = require('../utils/cryptoUtils');
const { ROLES } = require('../config/constants');
const {
  sendSocietyApplicationReceivedEmail,
  sendSocietyApprovedEmail,
  sendSocietyRejectedEmail,
  sendFeedbackNotificationEmail,
} = require('../utils/emailService');

/**
 * Use Case 1: Public Society Onboarding Application
 */
const applySociety = async (req, res, next) => {
  try {
    const { name, address, submittedBy } = req.body;
    // submittedBy format: { name, phone, email }
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const adminEmail = submittedBy.email.trim();
    const adminPhone = submittedBy.phone.trim();

    // 1. Check if society with same name already exists (case-insensitive check)
    const existingSociety = await Society.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        trimmedName.toLowerCase()
      ),
    });

    if (existingSociety) {
      if (existingSociety.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: `Society "${trimmedName}" is already registered and approved. Please sign in to the portal or contact support.`,
        });
      } else if (existingSociety.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: `An onboarding application for "${trimmedName}" has already been submitted and is pending review by the administrator.`,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `A previous application for "${trimmedName}" was rejected. Please contact support or use a different name.`,
        });
      }
    }

    // 2. Check if admin email is already registered as an existing User
    const existingUserEmail = await User.findOne({ where: { email: adminEmail } });
    if (existingUserEmail) {
      return res.status(400).json({
        success: false,
        message: `An account with email "${adminEmail}" already exists. Please use a different administrator email address.`,
      });
    }

    // 3. Check if admin phone is already registered as an existing User
    const existingUserPhone = await User.findOne({ where: { phone: adminPhone } });
    if (existingUserPhone) {
      return res.status(400).json({
        success: false,
        message: `Mobile phone number "${adminPhone}" is already registered with another account. Please use a different phone number.`,
      });
    }

    const society = await Society.create({
      name: trimmedName,
      address: trimmedAddress,
      submittedBy: {
        name: submittedBy.name.trim(),
        email: adminEmail,
        phone: adminPhone,
      },
      status: 'pending',
    });

    // Send Application Received Email (Async, non-blocking)
    sendSocietyApplicationReceivedEmail({
      applicantEmail: submittedBy.email,
      applicantName: submittedBy.name,
      societyName: name,
      address,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Society application submitted successfully. Confirmation email sent.',
      data: society,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: List societies (with pagination & status filter)
 */
const getSocieties = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    const { count, rows } = await Society.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'adminUser', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
      ],
    });

    res.json({
      success: true,
      data: rows || [],
      meta: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Get single society details
 */
const getSocietyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const society = await Society.findByPk(id, {
      include: [
        { model: User, as: 'adminUser', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
      ],
    });

    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    res.json({ success: true, data: society });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Approve Society Onboarding Application
 * - Creates society_admin User
 * - Generates rotatable invite link token for society
 * - Updates Society status to approved
 */
const approveSociety = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const society = await Society.findByPk(id, { transaction: t });

    if (!society) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    if (society.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ success: false, message: `Society is already '${society.status}'.` });
    }

    const { name, email, phone } = society.submittedBy;
    const tempPassword = `Admin@${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create Society Admin user
    const adminUser = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: ROLES.SOCIETY_ADMIN,
      societyId: society.id,
      status: 'approved',
    }, { transaction: t });

    // Generate unique invite token valid for 1 year (365 days)
    const inviteLinkToken = generateRandomToken(24);
    const inviteLinkExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await society.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      adminUserId: adminUser.id,
      inviteLinkToken,
      inviteLinkExpiry,
    }, { transaction: t });

    await t.commit();

    // Send Approval Email with Login Credentials and Member Invite Link (Non-blocking)
    sendSocietyApprovedEmail({
      applicantEmail: email,
      applicantName: name,
      societyName: society.name,
      loginEmail: email,
      temporaryPassword: tempPassword,
      inviteLinkToken,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Society approved successfully. Credentials generated and email sent to Society Admin.',
      data: {
        societyId: society.id,
        societyName: society.name,
        adminCredentials: {
          email,
          temporaryPassword: tempPassword,
        },
        inviteLinkToken,
      },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Super Admin: Reject Society Application
 */
const rejectSociety = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const society = await Society.findByPk(id);

    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    await society.update({
      status: 'rejected',
    });

    // Send Rejection Email (Non-blocking)
    if (society.submittedBy && society.submittedBy.email) {
      sendSocietyRejectedEmail({
        applicantEmail: society.submittedBy.email,
        applicantName: society.submittedBy.name,
        societyName: society.name,
        reason,
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Society application rejected. Notification email sent.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Society Admin: Get or Rotate Member Invite Link Token
 */
const getOrRotateInviteLink = async (req, res, next) => {
  try {
    const { rotate } = req.query;
    const societyId = req.user.societyId || (req.params.id !== 'me' ? req.params.id : null);

    if (!societyId) {
      return res.json({ success: true, data: null });
    }

    const society = await Society.findByPk(societyId);
    if (!society) {
      return res.json({ success: true, data: null });
    }

    if (rotate === 'true' || !society.inviteLinkToken) {
      const inviteLinkToken = generateRandomToken(24);
      const inviteLinkExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Valid for 1 year

      await society.update({ inviteLinkToken, inviteLinkExpiry });
      society.inviteLinkToken = inviteLinkToken;
      society.inviteLinkExpiry = inviteLinkExpiry;
    } else if (!society.inviteLinkExpiry) {
      // Ensure existing societies without expiry date have 1 year from approval/creation
      const inviteLinkExpiry = new Date(new Date(society.approvedAt || society.createdAt || Date.now()).getTime() + 365 * 24 * 60 * 60 * 1000);
      await society.update({ inviteLinkExpiry });
      society.inviteLinkExpiry = inviteLinkExpiry;
    }

    res.json({
      success: true,
      data: {
        societyId: society.id,
        societyName: society.name,
        inviteLinkToken: society.inviteLinkToken,
        inviteLinkExpiry: society.inviteLinkExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public: Submit User Feedback / Help Request (Triggers SMTP Notification)
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { name, emailOrPhone, category, message } = req.body;

    await SupportInquiry.create({
      name: name || 'Anonymous',
      emailOrPhone: emailOrPhone || 'N/A',
      category: category || 'general',
      message,
    });

    // Send SMTP notification asynchronously
    sendFeedbackNotificationEmail({ name, emailOrPhone, category, message })
      .catch((err) => {
        // Log but don't fail the request if mail server is temporarily unreachable
        const logger = require('../utils/logger');
        logger.error(`[SMTP ERROR] Failed to send feedback notification: ${err.message}`);
      });

    return res.status(200).json({
      success: true,
      message: 'Feedback received successfully. Our team has been notified via email.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applySociety,
  getSocieties,
  getSocietyById,
  approveSociety,
  rejectSociety,
  getOrRotateInviteLink,
  submitFeedback,
};
