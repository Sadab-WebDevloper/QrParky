const express = require('express');
const router = express.Router();
const {
  createOrder,
  handlePaymentWebhook,
  getOrderStatus,
} = require('../controllers/order.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { z } = require('zod');

const orderSchema = z.object({
  body: z.object({
    vehicleIds: z.array(z.number()),
    idempotencyKey: z.string().min(8),
  }),
});

// Member Order Endpoints
router.post('/member/orders', authenticate, authorize('member'), validate(orderSchema), createOrder);
router.get('/member/orders/:id/status', authenticate, authorize('member'), getOrderStatus);

// Webhook Endpoint (Public, Signature-Verified Only)
router.post('/webhooks/razorpay', handlePaymentWebhook);

module.exports = router;
