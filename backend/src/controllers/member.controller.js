const bcrypt = require('bcryptjs');
const { Society, User } = require('../models');
const { logAudit } = require('../utils/auditLogger');
const { ROLES } = require('../config/constants');

/**
 * Validate Invite Link Token & get Society info
 */
const validateInviteToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const society = await Society.findOne({
      where: { inviteLinkToken: token, status: 'approved' },
      attributes: ['id', 'name', 'address', 'inviteLinkExpiry'],
    });

    if (!society) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite link.' });
    }

    if (society.inviteLinkExpiry && new Date() > new Date(society.inviteLinkExpiry)) {
      return res.status(400).json({ success: false, message: 'Invite link has expired. Request a new link from your Society Admin.' });
    }

    res.json({ success: true, data: society });
  } catch (error) {
    next(error);
  }
};

/**
 * Use Case 2: Public Member Registration via Invite Token
 */
const registerMember = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { name, email, phone, password } = req.body;

    const society = await Society.findOne({
      where: { inviteLinkToken: token, status: 'approved' },
    });

    if (!society) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite link.' });
    }

    if (society.inviteLinkExpiry && new Date() > new Date(society.inviteLinkExpiry)) {
      return res.status(400).json({ success: false, message: 'Invite link has expired.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: ROLES.MEMBER,
      societyId: society.id,
      status: 'pending',
    });

    await logAudit({
      actorRole: 'public_member',
      action: 'member_registered',
      targetType: 'user',
      targetId: user.id,
      metadata: { societyId: society.id, email },
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Pending Society Admin approval.',
      data: { id: user.id, name: user.name, email: user.email, status: user.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Society Admin: List members (with status filter & pagination)
 */
const getSocietyMembers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const societyId = req.user.societyId;

    const where = { societyId };
    if (status) where.status = status;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
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
 * Society Admin: Approve Member
 */
const approveMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await User.findOne({
      where: { id, societyId: req.user.societyId, role: ROLES.MEMBER },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in your society.' });
    }

    await member.update({ status: 'approved' });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'member_approved',
      targetType: 'user',
      targetId: member.id,
    });

    res.json({ success: true, message: 'Member approved successfully.', data: member });
  } catch (error) {
    next(error);
  }
};

/**
 * Society Admin: Reject / Suspend Member
 */
const rejectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action = 'rejected' } = req.body; // 'rejected' or 'suspended'
    const member = await User.findOne({
      where: { id, societyId: req.user.societyId },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in your society.' });
    }

    await member.update({ status: action });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: `member_${action}`,
      targetType: 'user',
      targetId: member.id,
    });

    res.json({ success: true, message: `Member ${action} successfully.` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateInviteToken,
  registerMember,
  getSocietyMembers,
  approveMember,
  rejectMember,
};
