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
const { publicRateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(6),
  }),
});

// Public endpoints
router.get('/public/societies/invite/:token', validateInviteToken);
router.post('/public/members/register/:token', publicRateLimiter, validate(registerSchema), registerMember);

// Society Admin endpoints
router.get('/society-admin/members', authenticate, authorize('society_admin', 'super_admin'), getSocietyMembers);
router.post('/society-admin/members/:id/approve', authenticate, authorize('society_admin', 'super_admin'), approveMember);
router.post('/society-admin/members/:id/reject', authenticate, authorize('society_admin', 'super_admin'), rejectMember);

module.exports = router;
