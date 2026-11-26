const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  societyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'societies',
      key: 'id',
    },
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  vehicleType: {
    type: DataTypes.ENUM('2wheeler', '4wheeler', 'other'),
    allowNull: false,
    defaultValue: '4wheeler',
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  passType: {
    type: DataTypes.ENUM('regular', 'professional'),
    allowNull: false,
    defaultValue: 'regular',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'awaiting_payment', 'active', 'expired', 'suspended'),
    allowNull: false,
    defaultValue: 'pending',
  },
  suspensionReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'vehicles',
  paranoid: true,
});

module.exports = Vehicle;
