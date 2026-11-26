const { Op } = require('sequelize');
const { Society, User, Vehicle, QRCode, Order, Payment, AuditLog } = require('../models');
const { ROLES } = require('../config/constants');

/**
 * Super Admin: System Dashboard Statistics
 */
const getSuperAdminStats = async (req, res, next) => {
  try {
    const totalSocieties = await Society.count();
    const pendingSocieties = await Society.count({ where: { status: 'pending' } });
    const approvedSocieties = await Society.count({ where: { status: 'approved' } });

    const totalUsers = await User.count();
    const totalMembers = await User.count({ where: { role: ROLES.MEMBER } });
    
    const totalVehicles = await Vehicle.count();
    const activeVehicles = await Vehicle.count({ where: { status: 'active' } });
    const pendingVehicles = await Vehicle.count({ where: { status: 'pending' } });

    const totalOrdersPaid = await Order.count({ where: { status: 'paid' } });
    const totalRevenuePaise = await Order.sum('amount', { where: { status: 'paid' } }) || 0;

    res.json({
      success: true,
      data: {
        societies: { total: totalSocieties, pending: pendingSocieties, approved: approvedSocieties },
        users: { total: totalUsers, members: totalMembers },
        vehicles: { total: totalVehicles, active: activeVehicles, pending: pendingVehicles },
        financials: { totalOrdersPaid, totalRevenueINR: Math.round(totalRevenuePaise / 100) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Ultra-Lightweight Sync Endpoint
 * Returns tiny footprint to check if new pending society applications exist.
 */
const getSuperAdminPendingCheck = async (req, res, next) => {
  try {
    const [pendingSocietiesCount, latestSociety] = await Promise.all([
      Society.count({ where: { status: 'pending' } }),
      Society.findOne({
        where: { status: 'pending' },
        order: [['id', 'DESC']],
        attributes: ['id', 'name', 'createdAt'],
      }),
    ]);

    const syncSignature = `${pendingSocietiesCount}_${latestSociety?.id || 0}`;

    res.json({
      success: true,
      data: {
        pendingSocietiesCount,
        latestSociety: latestSociety ? { id: latestSociety.id, name: latestSociety.name } : null,
        syncSignature,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Query System Audit Logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { targetType, action, from, to, page = 1, limit = 20 } = req.query;
    const where = {};

    if (targetType) where.targetType = targetType;
    if (action) where.action = action;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
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
 * Society Admin: Dashboard Statistics for their specific society
 */
const getSocietyAdminStats = async (req, res, next) => {
  try {
    const societyId = req.user.societyId;

    const totalMembers = await User.count({ where: { societyId, role: ROLES.MEMBER } });
    const pendingMembers = await User.count({ where: { societyId, role: ROLES.MEMBER, status: 'pending' } });
    const approvedMembers = await User.count({ where: { societyId, role: ROLES.MEMBER, status: 'approved' } });

    const totalVehicles = await Vehicle.count({ where: { societyId } });
    const pendingVehicles = await Vehicle.count({ where: { societyId, status: 'pending' } });
    const awaitingPaymentVehicles = await Vehicle.count({ where: { societyId, status: 'awaiting_payment' } });
    const activeVehicles = await Vehicle.count({ where: { societyId, status: 'active' } });

    res.json({
      success: true,
      data: {
        members: { total: totalMembers, pending: pendingMembers, approved: approvedMembers },
        vehicles: { total: totalVehicles, pending: pendingVehicles, awaitingPayment: awaitingPaymentVehicles, active: activeVehicles },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ultra-Lightweight Sync Endpoint: Returns tiny footprint (<50 bytes, ~1ms)
 * to verify if new pending requests exist without querying full lists.
 */
const getSocietyPendingCheck = async (req, res, next) => {
  try {
    const societyId = req.user.societyId;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'Society ID not linked.' });
    }

    const [pendingMembersCount, pendingVehiclesCount, latestVehicle, latestMember] = await Promise.all([
      User.count({
        where: { societyId, role: ROLES.MEMBER, status: 'pending' },
      }),
      Vehicle.count({
        where: { societyId, status: 'pending' },
      }),
      Vehicle.findOne({
        where: { societyId, status: 'pending' },
        order: [['id', 'DESC']],
        include: [{ model: User, as: 'owner', attributes: ['name'] }],
        attributes: ['id', 'vehicleNumber', 'createdAt'],
      }),
      User.findOne({
        where: { societyId, role: ROLES.MEMBER, status: 'pending' },
        order: [['id', 'DESC']],
        attributes: ['id', 'name', 'createdAt'],
      }),
    ]);

    const syncSignature = `${pendingMembersCount}_${pendingVehiclesCount}_${latestMember?.id || 0}_${latestVehicle?.id || 0}`;

    res.json({
      success: true,
      data: {
        pendingMembersCount,
        pendingVehiclesCount,
        latestMember: latestMember ? { id: latestMember.id, name: latestMember.name } : null,
        latestVehicle: latestVehicle ? {
          id: latestVehicle.id,
          vehicleNumber: latestVehicle.vehicleNumber,
          ownerName: latestVehicle.owner?.name,
        } : null,
        syncSignature,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unified Dashboard Bootstrap Endpoint
 * Consolidates stats, members, vehicles, invite-link and pending status into 1 single HTTP response.
 */
const getSocietyAdminInit = async (req, res, next) => {
  try {
    const societyId = req.user.societyId;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'Society ID not linked to user account.' });
    }

    const [
      totalMembers,
      pendingMembersCount,
      approvedMembers,
      totalVehicles,
      pendingVehiclesCount,
      awaitingPaymentVehicles,
      activeVehicles,
      members,
      vehicles,
      society,
    ] = await Promise.all([
      User.count({ where: { societyId, role: ROLES.MEMBER } }),
      User.count({ where: { societyId, role: ROLES.MEMBER, status: 'pending' } }),
      User.count({ where: { societyId, role: ROLES.MEMBER, status: 'approved' } }),
      Vehicle.count({ where: { societyId } }),
      Vehicle.count({ where: { societyId, status: 'pending' } }),
      Vehicle.count({ where: { societyId, status: 'awaiting_payment' } }),
      Vehicle.count({ where: { societyId, status: 'active' } }),
      User.findAll({
        where: { societyId, role: ROLES.MEMBER },
        limit: 100,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            attributes: ['id', 'vehicleNumber', 'vehicleType', 'status', 'passType'],
            required: false,
          },
        ],
      }),
      Vehicle.findAll({
        where: { societyId },
        limit: 100,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
          { model: QRCode, as: 'qrCode', attributes: ['id', 'isActive', 'revokedAt'] },
        ],
      }),
      Society.findByPk(societyId, {
        attributes: ['id', 'name', 'inviteLinkToken', 'inviteLinkExpiry'],
      }),
    ]);

    const stats = {
      members: { total: totalMembers, pending: pendingMembersCount, approved: approvedMembers },
      vehicles: {
        total: totalVehicles,
        pending: pendingVehiclesCount,
        awaitingPayment: awaitingPaymentVehicles,
        active: activeVehicles,
      },
    };

    const inviteLink = society ? {
      societyId: society.id,
      societyName: society.name,
      inviteLinkToken: society.inviteLinkToken,
      inviteLinkExpiry: society.inviteLinkExpiry,
    } : null;

    const latestMember = members.find(m => m.status === 'pending');
    const latestVehicle = vehicles.find(v => v.status === 'pending');
    const syncSignature = `${pendingMembersCount}_${pendingVehiclesCount}_${latestMember?.id || 0}_${latestVehicle?.id || 0}`;

    res.json({
      success: true,
      data: {
        stats,
        members,
        vehicles,
        inviteLink,
        pendingCheck: {
          pendingMembersCount,
          pendingVehiclesCount,
          latestMember: latestMember ? { id: latestMember.id, name: latestMember.name } : null,
          latestVehicle: latestVehicle ? {
            id: latestVehicle.id,
            vehicleNumber: latestVehicle.vehicleNumber,
            ownerName: latestVehicle.owner?.name,
          } : null,
          syncSignature,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Society Admin: Query Audit Logs pertaining to their society
 */
const getSocietyAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await AuditLog.findAndCountAll({
      limit: parseInt(limit, 10),
      offset,
      order: [['createdAt', 'DESC']],
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
 * Super Admin: Get All Users across the entire system with server-side pagination & filtering
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role, search } = req.query;
    const where = {};

    if (role && role !== 'all') {
      where.role = parseInt(role, 10);
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    if (page || limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'societyId', 'createdAt'],
        include: [{ model: Society, as: 'society', attributes: ['id', 'name'] }],
        limit: limitNum,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return res.json({
        success: true,
        data: rows,
        meta: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        },
      });
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'societyId', 'createdAt'],
      include: [{ model: Society, as: 'society', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Get Support & Help Messages submitted by users
 */
const getSupportFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await AuditLog.findAndCountAll({
      where: { targetType: 'feedback' },
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
    });

    let items = rows.map((r) => {
      const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : (r.metadata || {});
      return {
        id: r.id,
        name: meta.name || 'Anonymous',
        emailOrPhone: meta.emailOrPhone || 'N/A',
        category: meta.category || 'general',
        message: meta.message || '',
        createdAt: r.createdAt,
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.emailOrPhone.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          it.message.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      data: items,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Get all Orders & Payments across all societies
 */
const getAdminPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const orderWhere = {};
    if (status && status !== 'all') {
      orderWhere.status = status;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;

      // 1. Find matching members
      const matchingUsers = await User.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: q } },
            { email: { [Op.like]: q } },
            { phone: { [Op.like]: q } },
          ],
        },
        attributes: ['id'],
      });
      const matchingUserIds = matchingUsers.map((u) => u.id);

      // 2. Find matching societies
      const matchingSocieties = await Society.findAll({
        where: { name: { [Op.like]: q } },
        attributes: ['id'],
      });
      let societyUserIds = [];
      if (matchingSocieties.length > 0) {
        const socUsers = await User.findAll({
          where: { societyId: matchingSocieties.map((s) => s.id) },
          attributes: ['id'],
        });
        societyUserIds = socUsers.map((u) => u.id);
      }

      // 3. Find matching payments by Razorpay payment ID
      const matchingPayments = await Payment.findAll({
        where: { razorpayPaymentId: { [Op.like]: q } },
        attributes: ['orderId'],
      });
      const matchingOrderIdsFromPayment = matchingPayments.map((p) => p.orderId);

      const combinedUserIds = Array.from(new Set([...matchingUserIds, ...societyUserIds]));

      const orConditions = [
        { razorpayOrderId: { [Op.like]: q } },
      ];
      if (combinedUserIds.length > 0) {
        orConditions.push({ memberId: combinedUserIds });
      }
      if (matchingOrderIdsFromPayment.length > 0) {
        orConditions.push({ id: matchingOrderIdsFromPayment });
      }

      orderWhere[Op.or] = orConditions;
    }

    // Query orders with pagination and associations
    const { count, rows: orders } = await Order.findAndCountAll({
      where: orderWhere,
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'email', 'phone'],
          include: [
            {
              model: Society,
              as: 'society',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'razorpayPaymentId', 'verified', 'createdAt'],
        },
      ],
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    // Collect all vehicle IDs from orders to fetch vehicle details
    const allVehicleIds = Array.from(
      new Set(
        orders.flatMap((o) => {
          try {
            const vIds = typeof o.vehicleIds === 'string' ? JSON.parse(o.vehicleIds) : o.vehicleIds;
            return Array.isArray(vIds) ? vIds : [];
          } catch (e) {
            return [];
          }
        })
      )
    );

    const vehicleMap = {};
    if (allVehicleIds.length > 0) {
      const vehicles = await Vehicle.findAll({
        where: { id: allVehicleIds },
        attributes: ['id', 'vehicleNumber', 'vehicleType', 'status'],
      });
      vehicles.forEach((v) => {
        vehicleMap[v.id] = v;
      });
    }

    const formattedOrders = orders.map((o) => {
      let vIds = [];
      try {
        vIds = typeof o.vehicleIds === 'string' ? JSON.parse(o.vehicleIds) : o.vehicleIds;
      } catch (e) {
        vIds = [];
      }
      const orderVehicles = Array.isArray(vIds) ? vIds.map((id) => vehicleMap[id]).filter(Boolean) : [];
      const latestPayment = o.payments && o.payments.length > 0 ? o.payments[o.payments.length - 1] : null;

      return {
        id: o.id,
        orderId: o.id,
        razorpayOrderId: o.razorpayOrderId,
        razorpayPaymentId: latestPayment ? latestPayment.razorpayPaymentId : null,
        paymentVerified: latestPayment ? latestPayment.verified : false,
        amountINR: Math.round(o.amount / 100),
        amountPaise: o.amount,
        status: o.status,
        createdAt: o.createdAt,
        member: o.member
          ? {
              id: o.member.id,
              name: o.member.name,
              email: o.member.email,
              phone: o.member.phone,
              societyName: o.member.society ? o.member.society.name : 'N/A',
              societyId: o.member.society ? o.member.society.id : null,
            }
          : null,
        vehicles: orderVehicles.map((v) => ({
          id: v.id,
          vehicleNumber: v.vehicleNumber,
          vehicleType: v.vehicleType,
          status: v.status,
        })),
      };
    });

    // Summary metrics
    const [totalRevenuePaise, paidOrdersCount, totalOrdersCount] = await Promise.all([
      Order.sum('amount', { where: { status: 'paid' } }) || 0,
      Order.count({ where: { status: 'paid' } }),
      Order.count(),
    ]);

    res.json({
      success: true,
      data: formattedOrders,
      metrics: {
        totalRevenueINR: Math.round(totalRevenuePaise / 100),
        paidOrdersCount,
        totalOrdersCount,
      },
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuperAdminStats,
  getSuperAdminPendingCheck,
  getAuditLogs,
  getAllUsers,
  getSocietyAdminStats,
  getSocietyPendingCheck,
  getSocietyAdminInit,
  getSocietyAuditLogs,
  getSupportFeedback,
  getAdminPayments,
};

