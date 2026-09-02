const express = require('express');
const router = express.Router();
const { login, refresh, logout, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

// Auth endpoints (both /auth/* and direct paths supported)
router.post('/auth/login', loginRateLimiter, validate(loginSchema), login);
router.post('/login', loginRateLimiter, validate(loginSchema), login);

router.post('/auth/refresh', refresh);
router.post('/refresh', refresh);

router.post('/auth/logout', authenticate, logout);
router.post('/logout', authenticate, logout);

router.get('/auth/me', authenticate, getMe);
router.get('/me', authenticate, getMe);

module.exports = router;
