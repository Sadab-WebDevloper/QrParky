const { sequelize, Order, Payment, Vehicle, QRCode, User, Society } = require('../models');
const { createRazorpayOrder, verifyWebhookSignature, verifyPaymentSignature } = require('../utils/razorpay');
const { encryptPayload } = require('../utils/cryptoUtils');
const { generateQRDataUrl } = require('../utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');
const { sendPremiumPassNotificationToSuperAdmin } = require('../utils/emailService');
const logger = require('../utils/logger');
const config = require('../config/env');

const VEHICLE_PRICES_PAISE = {
  '4wheeler': 29900,  // ₹299
  '2wheeler': 19900,  // ₹199
};

/**
 * Use Case 4: Create Batch Order with Idempotency Key check
 */
const createOrder = async (req, res, next) => {
  try {
    const { vehicleIds, idempotencyKey } = req.body;
    const memberId = req.user.id;

    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one vehicle for payment.' });
    }

    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'Idempotency key is required to prevent duplicate orders.' });
    }

    // Check existing order with idempotency key
    const existingOrder = await Order.findOne({ where: { idempotencyKey } });
    if (existingOrder) {
      logger.info(`[IDEMPOTENCY] Returning existing order #${existingOrder.id} for key: ${idempotencyKey}`);
      return res.json({
        success: true,
        message: 'Order retrieved (idempotent request).',
        data: existingOrder,
      });
    }

    // Fetch and validate vehicles
    const vehicles = await Vehicle.findAll({
      where: {
        id: vehicleIds,
        memberId,
      },
    });

    if (vehicles.length !== vehicleIds.length) {
      return res.status(400).json({ success: false, message: 'One or more invalid vehicle IDs selected.' });
    }

    // Verify all selected vehicles are in 'awaiting_payment' status
    const invalidVehicles = vehicles.filter(v => v.status !== 'awaiting_payment');
    if (invalidVehicles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Vehicles ${invalidVehicles.map(v => v.vehicleNumber).join(', ')} are not eligible for payment (must be approved by admin).`,
      });
    }

    // Calculate total amount in paise
    let totalAmountPaise = 0;
    vehicles.forEach(v => {
      totalAmountPaise += VEHICLE_PRICES_PAISE[v.vehicleType] || 29900;
    });

    const receipt = `rcpt_${memberId}_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(totalAmountPaise, receipt);

    const order = await Order.create({
      memberId,
      vehicleIds,
      amount: totalAmountPaise,
      razorpayOrderId: razorpayOrder.id,
      idempotencyKey,
      status: 'created',
    });

    await logAudit({
      actorId: memberId,
      actorRole: req.user.role,
      action: 'order_created',
      targetType: 'order',
      targetId: order.id,
      metadata: { razorpayOrderId: razorpayOrder.id, amount: totalAmountPaise, vehicleIds },
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Initiate Razorpay payment.',
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmountPaise,
        currency: 'INR',
        keyId: config.razorpay.keyId,
        isMock: razorpayOrder.isMock || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Webhook & Process Payment Activation
 * Multi-step transaction:
 * 1. Mark Order -> 'paid'
 * 2. Create Payment record
 * 3. Update Vehicles -> 'active'
 * 4. Generate AES-256-GCM encrypted payload & QR image for each vehicle
 * 5. Write Audit log
 */
const handlePaymentWebhook = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'] || req.body.razorpay_signature;
    const payload = req.body;
    let razorpayOrderId, razorpayPaymentId, razorpaySignature;

    if (payload.payload && (payload.payload.payment || payload.payload.order)) {
      // 1. Server-to-server webhook event
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        await t.rollback();
        logger.error('[SECURITY WARNING] Invalid Razorpay webhook signature detected!');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      }

      const entity = payload.payload.payment ? payload.payload.payment.entity : payload.payload.order.entity;
      razorpayOrderId = entity.order_id || entity.id;
      razorpayPaymentId = entity.id;
      razorpaySignature = signature;
    } else if (payload.razorpay_order_id && payload.razorpay_payment_id) {
      // 2. Client checkout popup callback verification
      razorpayOrderId = payload.razorpay_order_id;
      razorpayPaymentId = payload.razorpay_payment_id;
      razorpaySignature = payload.razorpay_signature || signature;

      const isValid = verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValid) {
        await t.rollback();
        logger.error('[SECURITY WARNING] Invalid Razorpay client payment signature detected!');
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
      }
    } else {
      await t.rollback();
      return res.json({ success: true, message: 'Unhandled webhook event type.' });
    }

    const order = await Order.findOne({
      where: { razorpayOrderId },
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Idempotent webhook execution check
    if (order.status === 'paid') {
      await t.rollback();
      logger.info(`[WEBHOOK IDEMPOTENT] Order #${order.id} is already processed.`);
      return res.json({ success: true, message: 'Order already processed.' });
    }

    // 1. Update Order status
    await order.update({ status: 'paid' }, { transaction: t });

    // 2. Create Payment audit record
    await Payment.create({
      orderId: order.id,
      razorpayPaymentId,
      razorpaySignature,
      verified: true,
      rawWebhookPayload: payload,
    }, { transaction: t });

    // 3. Process vehicles & QR codes
    const vehicleIds = order.vehicleIds;
    for (const vId of vehicleIds) {
      const vehicle = await Vehicle.findByPk(vId, { transaction: t });
      if (vehicle) {
        await vehicle.update({ status: 'active' }, { transaction: t });

        // 1 Year validity period from pass activation
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        // Encrypt QR token payload securely
        const qrPayloadObj = {
          vehicleId: vehicle.id,
          societyId: vehicle.societyId,
          vehicleNumber: vehicle.vehicleNumber,
          issuedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        };

        const encryptedToken = encryptPayload(qrPayloadObj);
        const verificationUrl = `${config.frontendUrl}/pass/verify/${encryptedToken}`;
        const qrImageDataUrl = await generateQRDataUrl(verificationUrl);

        // Upsert QR record (1 QR code per approved + paid vehicle)
        const [qrRecord, created] = await QRCode.findOrCreate({
          where: { vehicleId: vehicle.id },
          defaults: {
            vehicleId: vehicle.id,
            payloadEncrypted: encryptedToken,
            qrImageUrl: qrImageDataUrl,
            isActive: true,
            generatedAt: new Date(),
            expiresAt,
          },
          transaction: t,
        });

        if (!created) {
          await qrRecord.update({
            payloadEncrypted: encryptedToken,
            qrImageUrl: qrImageDataUrl,
            isActive: true,
            expiresAt,
            revokedAt: null,
          }, { transaction: t });
        }
      }
    }

    await logAudit({
      actorId: order.memberId,
      actorRole: 'member',
      action: 'payment_verified_vehicles_activated',
      targetType: 'order',
      targetId: order.id,
      metadata: { razorpayPaymentId, vehicleIdsCount: vehicleIds.length },
    }, t);

    await t.commit();
    logger.info(`[PAYMENT SUCCESS] Order #${order.id} verified & activated ${vehicleIds.length} vehicles.`);

    // Asynchronously notify Super Admin about paid premium passes
    (async () => {
      try {
        const member = await User.findByPk(order.memberId);
        const society = member?.societyId ? await Society.findByPk(member.societyId) : null;
        for (const vId of vehicleIds) {
          const veh = await Vehicle.findByPk(vId);
          if (veh) {
            sendPremiumPassNotificationToSuperAdmin({
              societyName: society?.name || 'Housing Society',
              memberName: member?.name || 'Member',
              memberEmail: member?.email || 'N/A',
              memberPhone: member?.phone || 'N/A',
              vehicleNumber: veh.vehicleNumber,
              vehicleType: veh.vehicleType,
              fee: '₹499 (PAID & ACTIVE)',
              status: 'Payment Captured - QR Generated (Ready for Holographic Sticker Dispatch)',
            }).catch(() => {});
          }
        }
      } catch (err) {
        logger.error(`Failed to notify super admin of paid order: ${err.message}`);
      }
    })();

    res.json({ success: true, message: 'Payment verified and vehicles activated successfully.' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Member: Get Order Status (for Polling after checkout modal)
 */
const getOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      where: { id, memberId: req.user.id },
      include: [{ model: Payment, as: 'payments' }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        amount: order.amount,
        vehicleIds: order.vehicleIds,
        razorpayOrderId: order.razorpayOrderId,
        paidAt: order.payments && order.payments.length > 0 ? order.payments[0].createdAt : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  handlePaymentWebhook,
  getOrderStatus,
};
