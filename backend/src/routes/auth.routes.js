const express = require('express');
const router = express.Router();
const {
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authMiddleware');
const {
  checkMaliciousIp,
  loginRateLimiter,
  passwordResetRateLimiter,
} = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    newPassword: z.string().min(6),
  }),
});

// Auth endpoints (both /auth/* and direct paths supported)
router.post('/auth/login', checkMaliciousIp, loginRateLimiter, validate(loginSchema), login);
router.post('/login', checkMaliciousIp, loginRateLimiter, validate(loginSchema), login);

router.post('/auth/forgot-password', checkMaliciousIp, passwordResetRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/forgot-password', checkMaliciousIp, passwordResetRateLimiter, validate(forgotPasswordSchema), forgotPassword);

router.post('/auth/reset-password', checkMaliciousIp, passwordResetRateLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/reset-password', checkMaliciousIp, passwordResetRateLimiter, validate(resetPasswordSchema), resetPassword);

router.post('/auth/refresh', checkMaliciousIp, refresh);
router.post('/refresh', checkMaliciousIp, refresh);

router.post('/auth/logout', authenticate, logout);
router.post('/logout', authenticate, logout);

router.get('/auth/me', authenticate, getMe);
router.get('/me', authenticate, getMe);

module.exports = router;
