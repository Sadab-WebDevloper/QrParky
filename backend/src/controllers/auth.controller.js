const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const { User, Society } = require('../models');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { recordSuspiciousAttempt } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { ROLES } = require('../config/constants');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, societyId: user.societyId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const user = await User.findOne({
      where: { email },
      include: [{ model: Society, as: 'society', attributes: ['id', 'name', 'status'] }],
    });

    if (!user) {
      await recordSuspiciousAttempt(ip, { email, reason: 'unknown_user_attempt' });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 1. Check if Account is Currently Locked
    if (user.lockUntil && new Date() < new Date(user.lockUntil)) {
      const minutesRemaining = Math.ceil((new Date(user.lockUntil) - new Date()) / 60000);
      await recordSuspiciousAttempt(ip, { userId: user.id, email, reason: 'attempt_while_locked' });

      return res.status(423).json({
        success: false,
        locked: true,
        minutesRemaining,
        code: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked due to suspicious activity (multiple failed attempts). Please try again in ${minutesRemaining} minute(s).`,
      });
    }

    // 2. Validate Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const willLock = attempts >= MAX_FAILED_ATTEMPTS;
      const lockUntil = willLock ? new Date(Date.now() + LOCK_TIME_MS) : null;

      await user.update({
        failedLoginAttempts: attempts,
        lockUntil: lockUntil || user.lockUntil,
      });

      await recordSuspiciousAttempt(ip, { userId: user.id, email, attempts });

      if (willLock) {
        logger.warn(`[SECURITY ALERT] Account locked for user: ${user.email} (IP: ${ip}) due to ${attempts} failed attempts.`);

        return res.status(423).json({
          success: false,
          locked: true,
          minutesRemaining: 15,
          code: 'ACCOUNT_LOCKED',
          message: 'Malicious activity alert: 5 consecutive failed login attempts detected. Your account has been temporarily locked for 15 minutes for your protection.',
        });
      }

      const remainingAttempts = MAX_FAILED_ATTEMPTS - attempts;

      return res.status(401).json({
        success: false,
        attemptsRemaining,
        message: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before temporary account lockout.`,
      });
    }

    // 3. Password matched -> Reset failed attempts & unlock account
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await user.update({
        failedLoginAttempts: 0,
        lockUntil: null,
      });
    }

    // 4. Check account status approval
    if (user.status !== 'approved' && user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: `Account is currently '${user.status}'. Approval by Society Adminrequired.`,
      });
    }

    // 5. Generate and store tokens
    const { accessToken, refreshToken } = generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.update({ refreshTokenHash });

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          societyId: user.societyId,
          societyName: user.society ? user.society.name : null,
          avatar: user.avatar || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ success: false, message: 'Invalid refresh session.' });
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      // Refresh token reuse detected / compromised -> revoke refresh tokens
      await user.update({ refreshTokenHash: null });
      return res.status(401).json({ success: false, message: 'Token reuse detected. Session revoked.' });
    }

    const tokens = generateTokens(user);
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await user.update({ refreshTokenHash: newRefreshTokenHash });

    res.json({
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await req.user.update({ refreshTokenHash: null });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
      include: [{ model: Society, as: 'society', attributes: ['id', 'name', 'address', 'status', 'inviteLinkToken'] }],
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password: Request a time-limited reset link
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const user = await User.findOne({ where: { email } });

    // Always return success message to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent to your inbox.',
      });
    }

    // Generate random 32-byte cryptographic token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    });

    // Send reset email non-blocking
    sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.name,
      resetToken,
    }).catch((err) => logger.error(`Failed to send password reset email: ${err.message}`));

    res.json({
      success: true,
      message: 'If this email is registered, a password reset link has been sent to your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password: Submit new password using valid reset token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetExpiry || new Date() > new Date(user.passwordResetExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password, clear reset tokens, reset lockout counters, revoke old sessions
    await user.update({
      passwordHash: newPasswordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      failedLoginAttempts: 0,
      lockUntil: null,
      refreshTokenHash: null,
    });

    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
