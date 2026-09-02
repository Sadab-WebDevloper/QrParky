const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { User, Society } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const { ROLES, ROLE_NAMES } = require('../config/constants');

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

    const user = await User.findOne({
      where: { email },
      include: [{ model: Society, as: 'society', attributes: ['id', 'name', 'status'] }],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status !== 'approved' && user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: `Account is currently '${user.status}'. Approval by Society Admin or Super Admin is required.`,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    
    // Save hashed refresh token for rotation security
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.update({ refreshTokenHash });

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'user_login',
      targetType: 'user',
      targetId: user.id,
    });

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
      await logAudit({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'user_logout',
        targetType: 'user',
        targetId: req.user.id,
      });
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

module.exports = { login, refresh, logout, getMe };
