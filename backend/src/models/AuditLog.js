const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  actorRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING, // e.g. vehicle_approved, society_rejected, qr_revoked
    allowNull: false,
  },
  targetType: {
    type: DataTypes.STRING, // vehicle, society, user, order, qr_code
    allowNull: false,
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON, // before/after snapshot or context
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
  paranoid: false,
  indexes: [
    { fields: ['created_at'] },
    { fields: ['target_type'] },
    { fields: ['actor_id'] },
  ],
});

module.exports = AuditLog;
