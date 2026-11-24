const express = require('express');
const router = express.Router();
const {
  getSuperAdminStats,
  getAuditLogs,
  getAllUsers,
  getSocietyAdminStats,
  getSocietyAuditLogs,
  getSupportFeedback,
} = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// Super Admin Dashboards
router.get('/admin/dashboard/stats', authenticate, authorize('super_admin'), getSuperAdminStats);
router.get('/admin/users', authenticate, authorize('super_admin'), getAllUsers);
router.get('/admin/audit-logs', authenticate, authorize('super_admin'), getAuditLogs);
router.get('/admin/support-feedback', authenticate, authorize('super_admin'), getSupportFeedback);

// Society Admin Dashboards
router.get('/society-admin/dashboard/stats', authenticate, authorize('society_admin', 'super_admin'), getSocietyAdminStats);
router.get('/society-admin/audit-logs', authenticate, authorize('society_admin', 'super_admin'), getSocietyAuditLogs);

module.exports = router;
