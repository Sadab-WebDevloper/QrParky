const express = require('express');
const router = express.Router();
const {
  applySociety,
  getSocieties,
  getSocietyById,
  approveSociety,
  rejectSociety,
  getOrRotateInviteLink,
} = require('../controllers/society.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { publicRateLimiter, registrationRateLimiter, checkMaliciousIp } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const applySocietySchema = z.object({
  body: z.object({
    name: z.string().min(3),
    address: z.string().min(5),
    submittedBy: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
    }),
  }),
});

// Public endpoints
router.post('/public/societies/apply', checkMaliciousIp, registrationRateLimiter, validate(applySocietySchema), applySociety);

// Super Admin endpoints
router.get('/admin/societies', authenticate, authorize('super_admin'), getSocieties);
router.get('/admin/societies/:id', authenticate, authorize('super_admin'), getSocietyById);
router.post('/admin/societies/:id/approve', authenticate, authorize('super_admin'), approveSociety);
router.post('/admin/societies/:id/reject', authenticate, authorize('super_admin'), rejectSociety);

// Society Admin endpoints
router.get('/society/:id/invite-link', authenticate, authorize('society_admin', 'super_admin'), getOrRotateInviteLink);

module.exports = router;
