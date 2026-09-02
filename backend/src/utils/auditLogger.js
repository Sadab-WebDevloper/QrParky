const { AuditLog } = require('../models');
const logger = require('./logger');

/**
 * Creates an immutable audit record in the MySQL database.
 */
const logAudit = async ({ actorId, actorRole, action, targetType, targetId, metadata = {} }, transaction = null) => {
  try {
    const log = await AuditLog.create({
      actorId: actorId || null,
      actorRole: actorRole || 'system',
      action,
      targetType,
      targetId: targetId || null,
      metadata,
    }, { transaction });
    logger.info(`[AUDIT] Action: ${action} | Target: ${targetType}#${targetId} | Actor: ${actorRole}#${actorId}`);
    return log;
  } catch (error) {
    logger.error('Failed to log audit event:', error);
  }
};

module.exports = { logAudit };
