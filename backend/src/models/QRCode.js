const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QRCode = sequelize.define('QRCode', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'vehicles',
      key: 'id',
    },
  },
  payloadEncrypted: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  qrImageUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'qr_codes',
  paranoid: false,
});

module.exports = QRCode;
