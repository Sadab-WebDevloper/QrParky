const bcrypt = require('bcryptjs');
const { sequelize, Society, User, Vehicle } = require('../models');
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

    // Validate vehicle number for resident parking pass application
    let normalizedVehicleNum = null;
    if (vehicleNumber && vehicleNumber.trim()) {
      normalizedVehicleNum = vehicleNumber.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    }

    if (!normalizedVehicleNum) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number is required to apply for a resident parking pass.',
      });
    }

    const existingVehicle = await Vehicle.findOne({
      where: { societyId: society.id, vehicleNumber: normalizedVehicleNum },
    });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: `Vehicle number ${normalizedVehicleNum} is already registered in this society.`,
      });
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

    // Atomically create User and Vehicle pass application inside a database transaction
    const { user, createdVehicle } = await sequelize.transaction(async (t) => {
      const newUser = await User.create({
        name,
        email,
        phone,
        passwordHash,
        role: ROLES.MEMBER,
        societyId: society.id,
        status: 'pending',
        avatar: avatar || null,
      }, { transaction: t });

      let newVehicle;
      try {
        newVehicle = await Vehicle.create({
          memberId: newUser.id,
          societyId: society.id,
          vehicleNumber: normalizedVehicleNum,
          vehicleName: vehicleName ? vehicleName.trim() : null,
          vehicleType: vehicleType === '2wheeler' ? '2wheeler' : '4wheeler',
          passType: 'regular',
          documents: documents || [],
          status: 'pending',
        }, { transaction: t });
      } catch (vehErr) {
        // Resilient fallback if remote production DB has not yet added the vehicle_name column
        if (vehErr.message && vehErr.message.includes('vehicle_name')) {
          newVehicle = await Vehicle.create({
            memberId: newUser.id,
            societyId: society.id,
            vehicleNumber: normalizedVehicleNum,
            vehicleType: vehicleType === '2wheeler' ? '2wheeler' : '4wheeler',
            passType: 'regular',
            documents: documents || [],
            status: 'pending',
          }, { transaction: t });
        } else {
          throw vehErr;
        }
      }

      return { user: newUser, createdVehicle: newVehicle };
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

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;
    const { count, rows } = await User.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      distinct: true,
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
