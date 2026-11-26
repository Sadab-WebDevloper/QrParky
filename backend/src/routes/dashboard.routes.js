const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// Super Admin Dashboards
router.get('/admin/dashboard/stats', authenticate, authorize('super_admin'), getSuperAdminStats);
router.get('/admin/pending-check', authenticate, authorize('super_admin'), getSuperAdminPendingCheck);
router.get('/admin/users', authenticate, authorize('super_admin'), getAllUsers);
router.get('/admin/audit-logs', authenticate, authorize('super_admin'), getAuditLogs);
router.get('/admin/support-feedback', authenticate, authorize('super_admin'), getSupportFeedback);
router.get('/admin/payments', authenticate, authorize('super_admin'), getAdminPayments);

// Society Admin Dashboards
router.get('/society-admin/dashboard/init', authenticate, authorize('society_admin', 'super_admin'), getSocietyAdminInit);
router.get('/society-admin/dashboard/stats', authenticate, authorize('society_admin', 'super_admin'), getSocietyAdminStats);
router.get('/society-admin/pending-check', authenticate, authorize('society_admin', 'super_admin'), getSocietyPendingCheck);
router.get('/society-admin/audit-logs', authenticate, authorize('society_admin', 'super_admin'), getSocietyAuditLogs);

module.exports = router;
