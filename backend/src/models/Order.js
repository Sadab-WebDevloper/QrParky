const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
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
  vehicleIds: {
    type: DataTypes.JSON, // Array of vehicle IDs e.g. [1, 2]
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER, // in paise
    allowNull: false,
  },
  razorpayOrderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('created', 'paid', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'created',
  },
}, {
  tableName: 'orders',
  paranoid: false,
  indexes: [
    { fields: ['member_id'] },
    { fields: ['razorpay_order_id'], unique: true },
    { fields: ['idempotency_key'], unique: true },
  ],
});

module.exports = Order;
