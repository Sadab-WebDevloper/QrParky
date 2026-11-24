const { Op } = require('sequelize');
const { Society, User, Vehicle, QRCode, Order, AuditLog } = require('../models');
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

module.exports = {
  getSuperAdminStats,
  getAuditLogs,
  getAllUsers,
  getSocietyAdminStats,
  getSocietyAuditLogs,
  getSupportFeedback,
};

