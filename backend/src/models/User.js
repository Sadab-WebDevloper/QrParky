const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { ROLES } = require('../config/constants');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: ROLES.MEMBER,
    comment: '1 = super_admin, 2 = society_admin, 3 = member',
  },
  societyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'societies',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    allowNull: false,
    defaultValue: 'pending',
  },
  refreshTokenHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passwordResetExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
}, {
  tableName: 'users',
});

module.exports = User;
