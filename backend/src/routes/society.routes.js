const express = require('express');
const router = express.Router();
const {
  applySociety,
  getSocieties,
  getSocietyById,
  approveSociety,
  rejectSociety,
  getOrRotateInviteLink,
  submitFeedback,
} = require('../controllers/society.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { publicRateLimiter, registrationRateLimiter, checkMaliciousIp } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const applySocietySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Society name must be at least 3 characters'),
    address: z.string().min(5, 'Full society address must be at least 5 characters'),
    submittedBy: z.object({
      name: z.string().min(2, 'Administrator name is required'),
      email: z.string().email('Please enter a valid administrator email address'),
      phone: z.string().regex(/^\d{10}$/, 'Mobile phone number must be exactly 10 digits'),
    }),
  }),
});

const feedbackSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    emailOrPhone: z.string().min(3, 'Email or Phone is required'),
    category: z.string().optional().default('improvement'),
    message: z.string().min(5, 'Message must be at least 5 characters'),
  }),
});

// Public endpoints
router.post('/public/societies/apply', checkMaliciousIp, registrationRateLimiter, validate(applySocietySchema), applySociety);
router.post('/public/feedback', checkMaliciousIp, publicRateLimiter, validate(feedbackSchema), submitFeedback);

// Super Admin endpoints
router.get('/admin/societies', authenticate, authorize('super_admin'), getSocieties);
router.get('/admin/societies/:id', authenticate, authorize('super_admin'), getSocietyById);
router.post('/admin/societies/:id/approve', authenticate, authorize('super_admin'), approveSociety);
router.post('/admin/societies/:id/reject', authenticate, authorize('super_admin'), rejectSociety);

// Society Admin endpoints
router.get('/society/:id/invite-link', authenticate, authorize('society_admin', 'super_admin'), getOrRotateInviteLink);

module.exports = router;
