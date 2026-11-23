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
    type: DataTypes.JSON,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
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
});

module.exports = Order;
