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

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const fullNameRegex = /^[a-zA-Z]+(?:[ '.-]+[a-zA-Z]+)+$/;

const applySocietySchema = z.object({
  body: z.object({
    name: z.string().min(5, 'Society name must be at least 5 characters'),
    address: z.string().min(5, 'Full physical address must be at least 5 characters').max(300, 'Full physical address cannot exceed 300 characters'),
    submittedBy: z.object({
      name: z.string().min(3, 'Full name must be at least 3 characters').regex(fullNameRegex, 'Please enter your full name (both first and last name, letters only)'),
      email: z.string().regex(emailRegex, 'Please enter a valid administrator email address'),
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
