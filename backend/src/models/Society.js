const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Society = sequelize.define('Society', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  submittedBy: {
    type: DataTypes.JSON, // { name, phone, email }
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  adminUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  inviteLinkToken: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  inviteLinkExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'societies',
  paranoid: false, // Societies hard kept for historical reference or track
  indexes: [
    { fields: ['invite_link_token'], unique: true },
    { fields: ['status'] },
  ],
});

module.exports = Society;
