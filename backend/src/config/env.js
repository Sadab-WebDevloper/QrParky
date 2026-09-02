const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'qr_parky_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-jwt-secret-key-32chars-minimum!',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-key-32chars!',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  qrSecret: process.env.QR_ENCRYPTION_SECRET || 'qr_parky_secret_encryption_key_32bytes!!',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'mockKeySecret67890',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'mockWebhookSecret12345',
    enableMock: process.env.ENABLE_MOCK_PAYMENTS === 'true',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"QrParky Support" <no-reply@qrparky.com>',
  },
};
