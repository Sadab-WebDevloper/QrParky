const express = require('express');
const router = express.Router();
const {
  getSuperAdminStats,
  getAllUsers,
  getSocietyAdminStats,
  getSocietyAdminInit,
  getSupportFeedback,
  getAdminPayments,
} = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// Super Admin Dashboards
router.get('/admin/dashboard/stats', authenticate, authorize('super_admin'), getSuperAdminStats);
router.get('/admin/users', authenticate, authorize('super_admin'), getAllUsers);
router.get('/admin/support-feedback', authenticate, authorize('super_admin'), getSupportFeedback);
router.get('/admin/payments', authenticate, authorize('super_admin'), getAdminPayments);

// Society Admin Dashboards
router.get('/society-admin/dashboard/init', authenticate, authorize('society_admin', 'super_admin'), getSocietyAdminInit);
router.get('/society-admin/dashboard/stats', authenticate, authorize('society_admin', 'super_admin'), getSocietyAdminStats);

module.exports = router;
