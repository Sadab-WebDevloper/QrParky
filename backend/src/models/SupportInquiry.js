const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SupportInquiry = sequelize.define('SupportInquiry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Anonymous',
  },
  emailOrPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'N/A',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'support_inquiries',
  timestamps: true,
  updatedAt: false,
  paranoid: false,
});

module.exports = SupportInquiry;
