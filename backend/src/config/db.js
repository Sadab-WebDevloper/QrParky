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

const connectDB = async () => {
  try {
    await ensureMySQLDatabaseExists();
    await sequelize.authenticate();
    logger.info(`✅ Database connected successfully to MySQL (${config.db.host}:${config.db.port}/${config.db.name}).`);
    await sequelize.sync({ alter: false });
    logger.info('✅ Database schema and models synchronized successfully.');
  } catch (error) {
    logger.error(`❌ Database connection failed! Unable to connect to MySQL (${config.db.host}:${config.db.port}/${config.db.name}).`);
    logger.error(`   Error Details: ${error.message}`);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
