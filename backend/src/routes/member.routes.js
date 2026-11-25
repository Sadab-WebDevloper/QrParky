const express = require('express');
const router = express.Router();
const {
  validateInviteToken,
  registerMember,
  getSocietyMembers,
  approveMember,
  rejectMember,
} = require('../controllers/member.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { publicRateLimiter, registrationRateLimiter, checkMaliciousIp } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^\d{10}$/, 'Mobile phone must be exactly 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    vehicleNumber: z.string().min(3).max(20).optional(),
    vehicleType: z.enum(['2wheeler', '4wheeler']).optional(),
    documents: z.array(z.string()).optional(),
  }),
});

// Public endpoints
router.get('/public/societies/invite/:token', checkMaliciousIp, publicRateLimiter, validateInviteToken);
router.post('/public/members/register/:token', checkMaliciousIp, registrationRateLimiter, validate(registerSchema), registerMember);

// Society Admin endpoints
router.get('/society-admin/members', authenticate, authorize('society_admin', 'super_admin'), getSocietyMembers);
router.post('/society-admin/members/:id/approve', authenticate, authorize('society_admin', 'super_admin'), approveMember);
router.post('/society-admin/members/:id/reject', authenticate, authorize('society_admin', 'super_admin'), rejectMember);

module.exports = router;
