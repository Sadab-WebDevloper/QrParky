const { sequelize } = require('../config/db');
const User = require('./User');
const Society = require('./Society');
const Vehicle = require('./Vehicle');
const QRCode = require('./QRCode');
const Order = require('./Order');
const Payment = require('./Payment');
const SupportInquiry = require('./SupportInquiry');

// Model Associations
// Society -> Users
Society.hasMany(User, { foreignKey: 'societyId', as: 'members' });
User.belongsTo(Society, { foreignKey: 'societyId', as: 'society' });

// Society -> Admin User (Creator / Main Admin)
Society.belongsTo(User, { foreignKey: 'adminUserId', as: 'adminUser' });
Society.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// User -> Vehicles
User.hasMany(Vehicle, { foreignKey: 'memberId', as: 'vehicles' });
Vehicle.belongsTo(User, { foreignKey: 'memberId', as: 'owner' });

// Society -> Vehicles
Society.hasMany(Vehicle, { foreignKey: 'societyId', as: 'vehicles' });
Vehicle.belongsTo(Society, { foreignKey: 'societyId', as: 'society' });

// Vehicle -> QRCode (1 to 1)
Vehicle.hasOne(QRCode, { foreignKey: 'vehicleId', as: 'qrCode' });
QRCode.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// User -> Orders
User.hasMany(Order, { foreignKey: 'memberId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'memberId', as: 'member' });

// Order -> Payments
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = {
  sequelize,
  User,
  Society,
  Vehicle,
  QRCode,
  Order,
  Payment,
  SupportInquiry,
};
