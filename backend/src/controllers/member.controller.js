const bcrypt = require('bcryptjs');
const { Society, User, Vehicle } = require('../models');
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
    const { name, email, phone, password, vehicleNumber, vehicleName, vehicleType, documents, avatar } = req.body;

    const society = await Society.findOne({
      where: { inviteLinkToken: token, status: 'approved' },
    });

    if (!society) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite link.' });
    }

    if (society.inviteLinkExpiry && new Date() > new Date(society.inviteLinkExpiry)) {
      return res.status(400).json({ success: false, message: 'Invite link has expired.' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email address is already registered. Please sign in or use a different email.' 
      });
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ 
        success: false, 
        message: `Mobile phone ${phone} is already registered. Please use a different phone number.` 
      });
    }

    // Check duplicate vehicle number in society if vehicle details provided
    let normalizedVehicleNum = null;
    if (vehicleNumber && vehicleNumber.trim()) {
      normalizedVehicleNum = vehicleNumber.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      const existingVehicle = await Vehicle.findOne({
        where: { societyId: society.id, vehicleNumber: normalizedVehicleNum },
      });
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: `Vehicle number ${normalizedVehicleNum} is already registered in this society.`,
        });
      }
    }

    // Validate avatar image if provided
    if (avatar) {
      const isJpgOrPng = avatar.startsWith('data:image/jpeg;base64,') ||
                         avatar.startsWith('data:image/jpg;base64,') ||
                         avatar.startsWith('data:image/png;base64,');
      if (!isJpgOrPng) {
        return res.status(400).json({
          success: false,
          message: 'Profile photo must be a JPG or PNG image.',
        });
      }
      if (avatar.length > 7000000) {
        return res.status(400).json({
          success: false,
          message: 'Profile photo must be 5MB or less.',
        });
      }
    }

    // Validate vehicle documents if provided
    if (documents && Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (typeof doc === 'string') {
          const isJpgOrPng = doc.startsWith('data:image/jpeg;base64,') ||
                             doc.startsWith('data:image/jpg;base64,') ||
                             doc.startsWith('data:image/png;base64,');
          if (!isJpgOrPng) {
            return res.status(400).json({
              success: false,
              message: 'Car / RC document must be a JPG or PNG image.',
            });
          }
          if (doc.length > 7000000) {
            return res.status(400).json({
              success: false,
              message: 'Car / RC document must be 5MB or less.',
            });
          }
        }
      }
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
      avatar: avatar || null,
    });

    // Create initial primary vehicle pass application if provided
    let createdVehicle = null;
    if (normalizedVehicleNum) {
      createdVehicle = await Vehicle.create({
        memberId: user.id,
        societyId: society.id,
        vehicleNumber: normalizedVehicleNum,
        vehicleName: vehicleName ? vehicleName.trim() : null,
        vehicleType: vehicleType === '2wheeler' ? '2wheeler' : '4wheeler',
        passType: 'regular',
        documents: documents || [],
        status: 'pending',
      });

      await logAudit({
        actorRole: 'public_member',
        action: 'vehicle_registered',
        targetType: 'vehicle',
        targetId: createdVehicle.id,
        metadata: { vehicleNumber: normalizedVehicleNum, societyId: society.id, memberId: user.id },
      });
    }

    await logAudit({
      actorRole: 'public_member',
      action: 'member_registered',
      targetType: 'user',
      targetId: user.id,
      metadata: { societyId: society.id, email, vehicleNumber: normalizedVehicleNum },
    });

    res.status(201).json({
      success: true,
      message: 'Registration and vehicle pass application submitted successfully! Pending Society Admin approval.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        vehicle: createdVehicle ? {
          id: createdVehicle.id,
          vehicleNumber: createdVehicle.vehicleNumber,
          vehicleName: createdVehicle.vehicleName,
          vehicleType: createdVehicle.vehicleType,
          status: createdVehicle.status,
        } : null,
      },
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
    const { status, page = 1, limit = 50 } = req.query;
    const societyId = req.user.societyId;

    const where = { 
      societyId,
      role: ROLES.MEMBER, // Exclude Society Admin from the members table
    };
    if (status) where.status = status;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'vehicleNumber', 'vehicleName', 'vehicleType', 'status', 'passType', 'documents'],
          required: false,
        },
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
