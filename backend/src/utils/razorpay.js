const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('./logger');

let razorpayInstance = null;

if (!config.razorpay.enableMock) {
  try {
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  } catch (err) {
    logger.warn('Failed to initialize Razorpay SDK (mock mode fallback enabled):', err.message);
  }
}

/**
 * Creates a Razorpay order or simulated order if in mock mode
 */
const createRazorpayOrder = async (amountInPaise, receiptId) => {
  if (config.razorpay.enableMock || !razorpayInstance) {
    const mockId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    logger.info(`[MOCK RAZORPAY] Created order: ${mockId} for amount: ${amountInPaise} paise`);
    return {
      id: mockId,
      entity: 'order',
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      status: 'created',
      isMock: true,
    };
  }

  return await razorpayInstance.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptId,
  });
};

/**
 * Verifies Razorpay Webhook HMAC SHA-256 signature
 */
const verifyWebhookSignature = (rawBody, signature, secret = config.razorpay.webhookSecret) => {
  if (config.razorpay.enableMock) {
    // In mock mode, allow mock signature check
    if (signature === 'mock_valid_signature' || !signature) return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  createRazorpayOrder,
  verifyWebhookSignature,
};
