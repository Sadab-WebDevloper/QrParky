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

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const fullNameRegex = /^[a-zA-Z]+(?:[ '.-]+[a-zA-Z]+)+$/;

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Full name must be at least 3 characters').regex(fullNameRegex, 'Please enter your full name (both first and last name, letters only)'),
    email: z.string().regex(emailRegex, 'Please enter a valid email address'),
    phone: z.string().regex(/^\d{10}$/, 'Mobile phone must be exactly 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    vehicleNumber: z.string().min(3).max(20).optional(),
    vehicleName: z.string().max(100).optional(),
    vehicleType: z.enum(['2wheeler', '4wheeler']).optional(),
    documents: z.array(z.string()).optional(),
    avatar: z.string().optional(),
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
