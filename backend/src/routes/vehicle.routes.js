const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { z } = require('zod');

const vehicleSchema = z.object({
  body: z.object({
    vehicleNumber: z.string().min(3),
    vehicleName: z.string().max(100).optional(),
    vehicleType: z.enum(['2wheeler', '4wheeler']),
    documents: z.array(z.string()).optional(),
  }),
});

const { scannerRateLimiter } = require('../middleware/rateLimiter');

// Member vehicle endpoints
router.post('/member/vehicles', authenticate, authorize('member'), validate(vehicleSchema), createVehicle);
router.get('/member/vehicles', authenticate, authorize('member'), getMyVehicles);
router.get('/member/vehicles/:id/qr', authenticate, authorize('member', 'society_admin', 'super_admin'), getVehicleQR);

// Society Admin vehicle endpoints
router.get('/society-admin/vehicles', authenticate, authorize('society_admin', 'super_admin'), getSocietyVehicles);
router.get('/society-admin/vehicles/:id/qr', authenticate, authorize('society_admin', 'super_admin'), getVehicleQR);
router.post('/society-admin/vehicles/:id/approve', authenticate, authorize('society_admin', 'super_admin'), approveVehicle);
router.post('/society-admin/vehicles/:id/reject', authenticate, authorize('society_admin', 'super_admin'), rejectVehicle);
router.post('/society-admin/vehicles/:id/suspend', authenticate, authorize('society_admin', 'super_admin'), suspendVehiclePass);
router.post('/society-admin/vehicles/:id/reactivate', authenticate, authorize('society_admin', 'super_admin'), reactivateVehiclePass);
router.post('/admin/vehicles/:id/qr/revoke', authenticate, authorize('society_admin', 'super_admin'), revokeQRCode);

// Public Scanner / Security Guard verification endpoint
router.get('/public/qr/verify/:token', scannerRateLimiter, verifyQRToken);

module.exports = router;
