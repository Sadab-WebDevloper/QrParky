const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error processing ${req.method} ${req.originalUrl}:`, err);

  // Unpack Sequelize Unique Constraint Errors (duplicate email, phone, etc.)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errorItem = err.errors?.[0];
    const rawPath = (errorItem?.path || '').toLowerCase();
    const rawMsg = (errorItem?.message || '').toLowerCase();
    const value = errorItem?.value || '';

    let cleanField = 'Information';
    if (rawPath.includes('phone') || rawMsg.includes('phone')) {
      cleanField = 'Mobile phone number';
    } else if (rawPath.includes('email') || rawMsg.includes('email')) {
      cleanField = 'Email address';
    } else if (rawPath.includes('vehicle') || rawMsg.includes('vehicle')) {
      cleanField = 'Vehicle registration number';
    }

    return res.status(400).json({
      success: false,
      message: `${cleanField}${value ? ` "${value}"` : ''} is already registered. Please use another.`,
      errors: err.errors,
    });
  }

  // Unpack Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    const msg = err.errors?.map(e => e.message).join(', ') || 'Validation error';
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${msg}`,
      errors: err.errors,
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
