const bcrypt = require('bcryptjs');
const { connectDB, sequelize } = require('./config/db');
const { User, Society, Vehicle, Order, Payment, QRCode, SupportInquiry } = require('./models');
const { ROLES } = require('./config/constants');
const logger = require('./utils/logger');

const cleanAndSeedSuperAdminOnly = async () => {
  try {
    await connectDB();
    logger.info('🧹 Cleaning all database tables...');

    // Disable foreign key checks for clean truncation
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    await QRCode.destroy({ where: {}, truncate: true, force: true });
    await Payment.destroy({ where: {}, truncate: true, force: true });
    await Order.destroy({ where: {}, truncate: true, force: true });
    await Vehicle.destroy({ where: {}, truncate: true, force: true });
    await SupportInquiry.destroy({ where: {}, truncate: true, force: true });
    await Society.destroy({ where: {}, truncate: true, force: true });
    await User.destroy({ where: {}, truncate: true, force: true });

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    logger.info('✅ All demo societies, vehicles, orders, payments, and users cleared.');

    // Create ONLY Super Admin
    const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@qrparky.com',
      phone: '9999999999',
      passwordHash: superAdminPassword,
      role: ROLES.SUPER_ADMIN,
      status: 'approved',
    });

    logger.info('=====================================================');
    logger.info('🎉 Database Cleaned & Super Admin Seeded Successfully!');
    logger.info('-----------------------------------------------------');
    logger.info('🔑 SUPER ADMIN CREDENTIALS:');
    logger.info('   Email:    superadmin@qrparky.com');
    logger.info('   Password: SuperAdmin@123');
    logger.info('   Role:     Super Administrator (Global Platform Access)');
    logger.info('=====================================================');
    process.exit(0);
  } catch (error) {
    logger.error('Database clean & seed failed:', error);
    process.exit(1);
  }
};

cleanAndSeedSuperAdminOnly();
