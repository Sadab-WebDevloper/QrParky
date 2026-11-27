const { Vehicle, QRCode, User, Society } = require('../models');
const { encryptPayload, decryptPayload } = require('../utils/cryptoUtils');
const { generateQRDataUrl } = require('../utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');
const { sendPremiumPassNotificationToSuperAdmin } = require('../utils/emailService');
const config = require('../config/env');
const { ROLES } = require('../config/constants');

/**
 * Use Case 3: Member submits vehicle registration
 */
const createVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, vehicleName, vehicleType, passType = 'regular', documents = [] } = req.body;
    const memberId = req.user.id;
    const societyId = req.user.societyId;

    if (!societyId) {
      return res.status(400).json({ success: false, message: 'Member does not belong to any active society.' });
    }

    // Check duplicate vehicle number in society
    const normalizedNum = vehicleNumber.toUpperCase().trim();
    const existing = await Vehicle.findOne({
      where: { societyId, vehicleNumber: normalizedNum },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Vehicle number ${normalizedNum} is already registered in this society.`,
      });
    }

    const vehicle = await Vehicle.create({
      memberId,
      societyId,
      vehicleName: vehicleName ? vehicleName.trim() : null,
      vehicleNumber: normalizedNum,
      vehicleType,
      passType: passType === 'professional' ? 'professional' : 'regular',
      documents,
      status: 'pending',
    });

    await logAudit({
      actorId: memberId,
      actorRole: req.user.role,
      action: 'vehicle_registered',
      targetType: 'vehicle',
      targetId: vehicle.id,
      metadata: { vehicleNumber: normalizedNum, vehicleType, passType },
    });

    // If member chose Professional (Premium) pass, notify Super Admin immediately
    if (vehicle.passType === 'professional') {
      const society = await Society.findByPk(societyId);
      const member = await User.findByPk(memberId);
      sendPremiumPassNotificationToSuperAdmin({
        societyName: society?.name || 'Housing Society',
        memberName: member?.name || req.user.name,
        memberEmail: member?.email || req.user.email,
        memberPhone: member?.phone || req.user.phone,
        vehicleNumber: normalizedNum,
        vehicleType,
        fee: '₹499',
        status: 'Submitted by Member (Pending Society Admin Approval)',
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Vehicle registration submitted. Awaiting Society Admin approval.',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Member: Get my registered vehicles
 */
const getMyVehicles = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const vehicles = await Vehicle.findAll({
      where: { memberId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: QRCode,
          as: 'qrCode',
          attributes: ['id', 'isActive', 'generatedAt', 'revokedAt', 'qrImageUrl'],
        },
      ],
    });

    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
};

/**
 * Society Admin: List vehicles (with filter & pagination)
 */
const getSocietyVehicles = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const societyId = req.user.societyId;

    const where = { societyId };
    if (status) where.status = status;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
        { model: QRCode, as: 'qrCode', attributes: ['id', 'isActive', 'revokedAt'] },
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
 * Society Admin: Approve Vehicle
 * - If passType === 'regular' (Default): Generates QR Code immediately with ₹0 fee (status = 'active')
 * - If passType === 'professional': Sets status = 'awaiting_payment' so member pays the premium fee.
 */
const approveVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { passType } = req.body; // Optional override by admin
    const vehicle = await Vehicle.findOne({
      where: { id, societyId: req.user.societyId },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found in your society.' });
    }

    if (vehicle.status !== 'pending' && vehicle.status !== 'awaiting_payment') {
      return res.status(400).json({ success: false, message: `Vehicle status is currently '${vehicle.status}'.` });
    }

    // 1 Year validity period from approval
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Generate Encrypted QR Code record (for preview / ready state)
    const qrPayload = {
      vehicleId: vehicle.id,
      societyId: vehicle.societyId,
      vehicleNumber: vehicle.vehicleNumber,
      issuedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    const encryptedToken = encryptPayload(qrPayload);
    const verificationUrl = `${config.frontendUrl}/pass/verify/${encryptedToken}`;
    const qrImageUrl = await generateQRDataUrl(verificationUrl);

    const [qrRecord, created] = await QRCode.findOrCreate({
      where: { vehicleId: vehicle.id },
      defaults: {
        vehicleId: vehicle.id,
        payloadEncrypted: encryptedToken,
        qrImageUrl,
        isActive: false, // inactive until ₹1 payment
        expiresAt,
      },
    });

    if (!created) {
      await qrRecord.update({
        payloadEncrypted: encryptedToken,
        qrImageUrl,
        isActive: false,
        expiresAt,
        revokedAt: null,
      });
    }

    await vehicle.update({
      status: 'awaiting_payment',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'vehicle_approved_awaiting_payment',
      targetType: 'vehicle',
      targetId: vehicle.id,
      metadata: { status: 'awaiting_payment', fee: vehicle.vehicleType === '2wheeler' ? 199 : 299 },
    });

    return res.json({
      success: true,
      message: `Vehicle approved by Committee! Member must pay ${vehicle.vehicleType === '2wheeler' ? '₹199' : '₹299'} pass fee to unlock & download the pass.`,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Society Admin: Reject Vehicle
 */
const rejectVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const vehicle = await Vehicle.findOne({
      where: { id, societyId: req.user.societyId },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found in your society.' });
    }

    await vehicle.update({
      status: 'rejected',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'vehicle_rejected',
      targetType: 'vehicle',
      targetId: vehicle.id,
      metadata: { reason },
    });

    res.json({ success: true, message: 'Vehicle rejected.', data: vehicle });
  } catch (error) {
    next(error);
  }
};

/**
 * Member / Society Admin / Super Admin: Get vehicle QR Vault access (ONLY if vehicle status = active)
 */
const getVehicleQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };

    if (req.user.role === 3) {
      // Member can only access their own vehicle QR
      where.memberId = req.user.id;
    } else if (req.user.role === 2) {
      // Society Admin can access any vehicle QR in their society
      where.societyId = req.user.societyId;
    }
    // Super Admin (role === 1) can access any vehicle QR

    const vehicle = await Vehicle.findOne({
      where,
      include: [
        { model: QRCode, as: 'qrCode' },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Society, as: 'society', attributes: ['id', 'name'] },
      ],
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or not in your society.' });
    }

    if (vehicle.status !== 'active' && vehicle.status !== 'awaiting_payment' && vehicle.status !== 'suspended') {
      return res.status(403).json({
        success: false,
        message: `QR code vault is restricted. Vehicle status is '${vehicle.status}'. Activation requires approval/payment verification.`,
      });
    }

    if (!vehicle.qrCode) {
      return res.status(404).json({ success: false, message: 'QR Code record not found or revoked.' });
    }

    const isLocked = vehicle.status === 'awaiting_payment';
    const isSuspended = vehicle.status === 'suspended';

    res.json({
      success: true,
      data: {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        passType: vehicle.passType,
        status: vehicle.status,
        suspensionReason: vehicle.suspensionReason,
        isLocked,
        isSuspended,
        fee: 1,
        ownerName: vehicle.owner?.name || 'Resident',
        ownerPhone: vehicle.owner?.phone || '',
        societyName: vehicle.society?.name || 'Society',
        qrImageUrl: vehicle.qrCode.qrImageUrl,
        payloadEncrypted: isLocked ? null : vehicle.qrCode.payloadEncrypted,
        generatedAt: vehicle.qrCode.generatedAt,
        expiresAt: vehicle.qrCode.expiresAt || new Date(new Date(vehicle.qrCode.generatedAt || vehicle.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin / Society Admin: Suspend Vehicle Pass (reversible hold)
 */
const suspendVehiclePass = async (req, res, next) => {
  try {
    const { id } = req.params; // vehicleId
    const { reason } = req.body;

    const vehicle = await Vehicle.findByPk(id, {
      include: [{ model: QRCode, as: 'qrCode' }],
    });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const suspensionReason = reason?.trim() || 'Suspended by society admin';

    if (vehicle.qrCode) {
      await vehicle.qrCode.update({
        isActive: false,
        revokedAt: new Date(),
      });
    }

    await vehicle.update({
      status: 'suspended',
      suspensionReason,
    });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'vehicle_pass_suspended',
      targetType: 'vehicle',
      targetId: id,
      metadata: { reason: suspensionReason },
    });

    res.json({
      success: true,
      message: 'Vehicle pass temporarily suspended. Resident will see the reason.',
      data: { id: vehicle.id, status: 'suspended', suspensionReason },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin / Society Admin: Reactivate Vehicle Pass (restore to active)
 */
const reactivateVehiclePass = async (req, res, next) => {
  try {
    const { id } = req.params; // vehicleId

    const vehicle = await Vehicle.findByPk(id, {
      include: [{ model: QRCode, as: 'qrCode' }],
    });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    if (vehicle.qrCode) {
      await vehicle.qrCode.update({
        isActive: true,
        revokedAt: null,
      });
    }

    await vehicle.update({
      status: 'active',
      suspensionReason: null,
    });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'vehicle_pass_reactivated',
      targetType: 'vehicle',
      targetId: id,
    });

    res.json({
      success: true,
      message: 'Vehicle pass reactivated successfully! Access restored to Active.',
      data: { id: vehicle.id, status: 'active' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin / Society Admin: Revoke lost/stolen QR Code (calls suspendVehiclePass)
 */
const revokeQRCode = suspendVehiclePass;

/**
 * Public Guard Verification Endpoint: Scan & decrypt QR Token
 */
const verifyQRToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token parameter is required.' });
    }

    const payload = decryptPayload(token);
    const { vehicleId, societyId, issuedAt } = payload;

    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [
        { model: User, as: 'owner', attributes: ['name', 'phone'] },
        { model: Society, as: 'society', attributes: ['name', 'address'] },
        { model: QRCode, as: 'qrCode' },
      ],
    });

    // Lookup Society Admin for emergency contact / wrong parking resolution
    const societyAdmin = await User.findOne({
      where: {
        societyId: vehicle ? vehicle.societyId : societyId,
        role: ROLES.SOCIETY_ADMIN,
      },
      attributes: ['name', 'phone', 'email'],
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Vehicle record not found.',
      });
    }

    if (vehicle.status === 'suspended') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `PASS SUSPENDED: ${vehicle.suspensionReason || 'Temporary administrative hold'}. Access is temporarily disabled.`,
        data: {
          vehicleNumber: vehicle.vehicleNumber,
          societyName: vehicle.society?.name || 'Society',
          adminName: societyAdmin?.name || 'Society Admin',
          adminPhone: societyAdmin?.phone || '',
          suspensionReason: vehicle.suspensionReason,
        },
      });
    }

    if (vehicle.status !== 'active') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'ACCESS DENIED. Vehicle pass is inactive, pending approval, or unverified.',
        data: {
          vehicleNumber: vehicle.vehicleNumber,
          societyName: vehicle.society?.name || 'Society',
          adminName: societyAdmin?.name || 'Society Admin',
          adminPhone: societyAdmin?.phone || '',
        },
      });
    }

    if (!vehicle.qrCode || !vehicle.qrCode.isActive || vehicle.qrCode.revokedAt) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'ACCESS DENIED. QR Code has been revoked or expired.',
        data: {
          vehicleNumber: vehicle.vehicleNumber,
          societyName: vehicle.society?.name || 'Society',
          adminName: societyAdmin?.name || 'Society Admin',
          adminPhone: societyAdmin?.phone || '',
        },
      });
    }

    // Check 1-Year Expiration
    const expiresAtDate = vehicle.qrCode.expiresAt || (payload.expiresAt ? new Date(payload.expiresAt) : null);
    if (expiresAtDate && new Date() > new Date(expiresAtDate)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'ACCESS DENIED. Vehicle pass has expired (1-year validity period ended). Please contact Society Admin for renewal.',
        data: {
          vehicleNumber: vehicle.vehicleNumber,
          societyName: vehicle.society?.name || 'Society',
          adminName: societyAdmin?.name || 'Society Admin',
          adminPhone: societyAdmin?.phone || '',
          expiredAt: expiresAtDate,
        },
      });
    }

    res.json({
      success: true,
      valid: true,
      message: 'ACCESS GRANTED. Verified Society Vehicle Pass.',
      data: {
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        passType: vehicle.passType,
        status: vehicle.status,
        societyName: vehicle.society?.name || 'Authorized Society',
        societyAddress: vehicle.society?.address || '',
        ownerName: vehicle.owner?.name || 'Registered Resident',
        ownerPhone: vehicle.owner?.phone || '',
        adminName: societyAdmin?.name || 'Society Admin / Security Desk',
        adminPhone: societyAdmin?.phone || '',
        adminEmail: societyAdmin?.email || '',
        issuedAt,
        expiresAt: expiresAtDate || new Date(new Date(issuedAt || Date.now()).getTime() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      valid: false,
      message: 'ACCESS DENIED. Invalid or tampered QR token payload.',
    });
  }
};

module.exports = {
  createVehicle,
  getMyVehicles,
  getSocietyVehicles,
  approveVehicle,
  rejectVehicle,
  getVehicleQR,
  revokeQRCode,
  suspendVehiclePass,
  reactivateVehiclePass,
  verifyQRToken,
};
