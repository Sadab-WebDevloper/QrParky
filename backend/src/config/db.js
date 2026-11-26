const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const config = require('./env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  logging: false,
  pool: { max: 10, min: 0, acquire: 10000, idle: 5000 },
  define: { timestamps: true, underscored: true, paranoid: true },
});

const ensureMySQLDatabaseExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\`;`);
    await connection.end();
  } catch (err) {
    logger.warn(`Raw MySQL connection warning: ${err.message}`);
  }
};

/**
 * Drop any duplicate indexes generated on MySQL tables to prevent hitting 64 keys limit
 */
const cleanupDuplicateIndexes = async () => {
  try {
    const [indexes] = await sequelize.query(`
      SELECT TABLE_NAME, INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = :dbName 
        AND INDEX_NAME != 'PRIMARY' 
        AND (INDEX_NAME LIKE '%_2' OR INDEX_NAME LIKE '%_3' OR INDEX_NAME LIKE '%_4' OR INDEX_NAME LIKE '%_5')
    `, { replacements: { dbName: config.db.name } });

    for (const idx of indexes) {
      try {
        await sequelize.query(`ALTER TABLE \`${idx.TABLE_NAME}\` DROP INDEX \`${idx.INDEX_NAME}\`;`);
        logger.info(`🧹 Cleaned up duplicate index ${idx.INDEX_NAME} from ${idx.TABLE_NAME}`);
      } catch (dropErr) {
        // Silently skip if locked or already removed
      }
    }
  } catch (err) {
    // Non-fatal index check
  }
};

/**
 * Ensure user security columns exist without using sync({ alter: true }) which causes duplicate keys
 */
const ensureUserSecurityColumns = async () => {
  try {
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = 'users';
    `, { replacements: { dbName: config.db.name } });

    const columnNames = columns.map(c => c.COLUMN_NAME.toLowerCase());

    if (!columnNames.includes('failed_login_attempts')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;');
      logger.info('✅ Added failed_login_attempts column to users table.');
    }
    if (!columnNames.includes('lock_until')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN lock_until DATETIME NULL;');
      logger.info('✅ Added lock_until column to users table.');
    }
    if (!columnNames.includes('password_reset_token')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL;');
      logger.info('✅ Added password_reset_token column to users table.');
    }
    if (!columnNames.includes('password_reset_expiry')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN password_reset_expiry DATETIME NULL;');
      logger.info('✅ Added password_reset_expiry column to users table.');
    }
    if (!columnNames.includes('avatar')) {
      await sequelize.query('ALTER TABLE users ADD COLUMN avatar LONGTEXT NULL;');
      logger.info('✅ Added avatar column to users table.');
    }

    const [vehicleCols] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = 'vehicles';
    `, { replacements: { dbName: config.db.name } });
    const vehicleColNames = vehicleCols.map(c => c.COLUMN_NAME.toLowerCase());
    if (!vehicleColNames.includes('vehicle_name')) {
      await sequelize.query('ALTER TABLE vehicles ADD COLUMN vehicle_name VARCHAR(100) NULL;');
      logger.info('✅ Added vehicle_name column to vehicles table.');
    }
    if (!vehicleColNames.includes('suspension_reason')) {
      await sequelize.query('ALTER TABLE vehicles ADD COLUMN suspension_reason VARCHAR(255) NULL;');
      logger.info('✅ Added suspension_reason column to vehicles table.');
    }
    try {
      await sequelize.query("ALTER TABLE vehicles MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'awaiting_payment', 'active', 'expired', 'suspended') NOT NULL DEFAULT 'pending';");
    } catch (enumErr) {
      // Ignored if already updated
    }
  } catch (err) {
    logger.warn(`User security columns check: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    await ensureMySQLDatabaseExists();
    await sequelize.authenticate();
    logger.info(`✅ Database connected successfully to MySQL (${config.db.host}:${config.db.port}/${config.db.name}).`);

    // Clean up any accumulated duplicate indexes from previous alter attempts
    await cleanupDuplicateIndexes();

    // Sync models safely with alter: false (avoids MySQL 64-index limit)
    await sequelize.sync({ alter: false });

    // Ensure new security columns exist on users table
    await ensureUserSecurityColumns();

    // Make society invite links permanent (never expire automatically, rotates only when admin refreshes)
    await sequelize.query('UPDATE societies SET invite_link_expiry = NULL WHERE invite_link_expiry IS NOT NULL;').catch(() => {});

    logger.info('✅ Database schema and models synchronized successfully.');
  } catch (error) {
    logger.error(`❌ Database connection failed! Unable to connect to MySQL (${config.db.host}:${config.db.port}/${config.db.name}).`);
    logger.error(`   Error Details: ${error.message}`);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
