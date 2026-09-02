const { ROLES, ROLE_NAMES } = require('../config/constants');

/**
 * Restricts endpoint access to specified roles.
 * Usage: authorize(ROLES.SUPER_ADMIN) or authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN)
 */
const authorize = (...roles) => {
  const allowedRoles = roles.map((r) => {
    if (typeof r === 'number') return r;
    if (r === 'super_admin') return ROLES.SUPER_ADMIN;
    if (r === 'society_admin') return ROLES.SOCIETY_ADMIN;
    if (r === 'member' || r === 'user') return ROLES.MEMBER;
    return r;
  });

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (!allowedRoles.includes(Number(req.user.role))) {
      const currentRoleName = ROLE_NAMES[req.user.role] || req.user.role;
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${currentRoleName}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
