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
  vehicleType: {
    type: DataTypes.ENUM('2wheeler', '4wheeler', 'other'),
    allowNull: false,
    defaultValue: '4wheeler',
  },
  documents: {
    type: DataTypes.JSON, // Array of proof URL strings
    allowNull: true,
    defaultValue: [],
  },
  passType: {
    type: DataTypes.ENUM('regular', 'professional'),
    allowNull: false,
    defaultValue: 'regular',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'awaiting_payment', 'active', 'expired'),
    allowNull: false,
    defaultValue: 'pending',
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
  paranoid: true, // soft delete deleted_at
  indexes: [
    { fields: ['member_id'] },
    { fields: ['society_id'] },
    { fields: ['society_id', 'status'] },
    { fields: ['society_id', 'vehicle_number'], unique: true },
  ],
});

module.exports = Vehicle;
