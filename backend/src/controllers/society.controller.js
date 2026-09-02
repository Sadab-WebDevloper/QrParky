const bcrypt = require('bcryptjs');
const { sequelize, Society, User } = require('../models');
const { generateRandomToken } = require('../utils/cryptoUtils');
const { logAudit } = require('../utils/auditLogger');
const { ROLES } = require('../config/constants');
const {
  sendSocietyApplicationReceivedEmail,
  sendSocietyApprovedEmail,
  sendSocietyRejectedEmail,
} = require('../utils/emailService');

/**
 * Use Case 1: Public Society Onboarding Application
 */
const applySociety = async (req, res, next) => {
  try {
    const { name, address, submittedBy } = req.body;
    // submittedBy format: { name, phone, email }

    // Check if society with same name or email already submitted
    const existingSociety = await Society.findOne({ where: { name } });
    if (existingSociety) {
      return res.status(400).json({ success: false, message: 'A society with this name has already been submitted.' });
    }

    const existingUser = await User.findOne({ where: { email: submittedBy.email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with submitted email already exists.' });
    }

    const society = await Society.create({
      name,
      address,
      submittedBy,
      status: 'pending',
    });

    await logAudit({
      actorRole: 'public_visitor',
      action: 'society_applied',
      targetType: 'society',
      targetId: society.id,
      metadata: { name, submittedByEmail: submittedBy.email },
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
    const { status, page = 1, limit = 10 } = req.query;
    const where = {};
    if (status) where.status = status;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows } = await Society.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'adminUser', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
      ],
    });

    res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit),
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

    // Generate unique invite token (30 days validity)
    const inviteLinkToken = generateRandomToken(24);
    const inviteLinkExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await society.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      adminUserId: adminUser.id,
      inviteLinkToken,
      inviteLinkExpiry,
    }, { transaction: t });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'society_approved',
      targetType: 'society',
      targetId: society.id,
      metadata: { adminUserId: adminUser.id, adminEmail: email },
    }, t);

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

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'society_rejected',
      targetType: 'society',
      targetId: society.id,
      metadata: { reason },
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
    const societyId = req.user.societyId || req.params.id;

    const society = await Society.findByPk(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }

    if (rotate === 'true' || !society.inviteLinkToken) {
      const inviteLinkToken = generateRandomToken(24);
      const inviteLinkExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await society.update({ inviteLinkToken, inviteLinkExpiry });

      await logAudit({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'invite_link_rotated',
        targetType: 'society',
        targetId: society.id,
      });
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

module.exports = {
  applySociety,
  getSocieties,
  getSocietyById,
  approveSociety,
  rejectSociety,
  getOrRotateInviteLink,
};
