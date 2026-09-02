const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    // 1. Connect to MySQL Database & sync models
    await connectDB();

    // 2. Start Express HTTP Server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 QrParky Server listening on port ${config.port} [ENV: ${config.nodeEnv}]`);
      logger.info(`   API Base URL: http://localhost:${config.port}/api/v1`);
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down gracefully...', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle Term Signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down HTTP server...');
      server.close(() => {
        logger.info('HTTP server closed.');
      });
    });

  } catch (error) {
    logger.error(`❌ Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
