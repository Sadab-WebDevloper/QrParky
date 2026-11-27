const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// In-memory tracker for malicious IPs (e.g. distributed brute force across accounts)
const maliciousIpMap = new Map();

/**
 * Middleware: Malicious Activity IP Blocker
 * Checks if an IP is currently banned due to detected malicious brute force activity.
 */
const checkMaliciousIp = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const banRecord = maliciousIpMap.get(ip);

  if (banRecord && banRecord.bannedUntil && new Date() < new Date(banRecord.bannedUntil)) {
    const minutesLeft = Math.ceil((new Date(banRecord.bannedUntil) - new Date()) / 60000);
    logger.warn(`[MALICIOUS ACTIVITY DETECTED] Blocked banned IP ${ip}. Ban expires in ${minutesLeft}m.`);
    return res.status(429).json({
      success: false,
      blocked: true,
      code: 'IP_BLOCKED_MALICIOUS_ACTIVITY',
      message: `Access denied. Suspicious/malicious activity detected from this IP. Temporarily blocked for ${minutesLeft} more minute(s).`,
    });
  }

  // Clear expired ban
  if (banRecord && banRecord.bannedUntil && new Date() >= new Date(banRecord.bannedUntil)) {
    maliciousIpMap.delete(ip);
  }

  next();
};

/**
 * Record a suspicious failed auth attempt for an IP
 */
const recordSuspiciousAttempt = async (ip, metadata = {}) => {
  if (!ip) return;
  const now = Date.now();
  const record = maliciousIpMap.get(ip) || { count: 0, firstAttempt: now, bannedUntil: null };

  // Reset window if older than 15 minutes
  if (now - record.firstAttempt > 15 * 60 * 1000) {
    record.count = 1;
    record.firstAttempt = now;
  } else {
    record.count += 1;
  }

  // If more than 8 failed attempts in 15 mins across IP -> BAN IP for 30 mins
  if (record.count >= 8) {
    record.bannedUntil = new Date(now + 30 * 60 * 1000); // 30 mins ban
    logger.error(`[SECURITY THREAT] Malicious brute-force attack detected from IP: ${ip}. Banned for 30 minutes.`);
  }

  maliciousIpMap.set(ip, record);
};

// 1. Public endpoints rate limiter
const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this network. Please try again after 15 minutes.',
  },
});

// 2. Strict Rate Limiter for Login Attempts
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    recordSuspiciousAttempt(ip, { route: 'login', email: req.body?.email });
    return res.status(429).json({
      success: false,
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts from this network. Temporarily rate-limited for 15 minutes to protect account security.',
    });
  },
});

// 3. Strict Rate Limiter for Registrations (Society Onboarding & Member Signups)
const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6, // Max 6 registration attempts per hour per IP to prevent bot spam
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      message: 'Too many registration requests from this network. Please wait 1 hour before attempting to register again.',
    });
  },
});

// 4. Password Reset Rate Limiter
const passwordResetRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 4, // Max 4 reset requests per 30 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    message: 'Too many password reset requests. Please wait 30 minutes before requesting again.',
  },
});

// 5. Gate Security QR Scanner Rate Limiter (Optimized for Guard flow)
const scannerRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 scans/min per guard station
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'SCANNER_RATE_LIMIT_EXCEEDED',
    message: 'Scanner scan limit exceeded. Please wait a moment before scanning another pass.',
  },
});

module.exports = {
  checkMaliciousIp,
  recordSuspiciousAttempt,
  publicRateLimiter,
  loginRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  scannerRateLimiter,
};
