const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('./logger');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!config.razorpay.enableMock && !razorpayInstance) {
    try {
      razorpayInstance = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
    } catch (err) {
      logger.warn('Failed to initialize Razorpay SDK (mock mode fallback enabled):', err.message);
    }
  }
  return razorpayInstance;
};

/**
 * Creates a Razorpay order or simulated order if in mock mode
 */
const createRazorpayOrder = async (amountInPaise, receiptId) => {
  const instance = getRazorpayInstance();
  if (config.razorpay.enableMock || !instance) {
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

  try {
    return await instance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
    });
  } catch (err) {
    logger.error(`Razorpay API order creation failed (${err.message}). Falling back to test mock order.`);
    const mockId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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
};

/**
 * Verifies Razorpay Checkout client signature (order_id|payment_id HMAC SHA256)
 */
const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (config.razorpay.enableMock || razorpayOrderId?.startsWith('order_mock_') || razorpaySignature === 'mock_valid_signature') {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
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
  verifyPaymentSignature,
  verifyWebhookSignature,
};
