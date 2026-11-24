const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Route Modules
const authRoutes = require('./routes/auth.routes');
const societyRoutes = require('./routes/society.routes');
const memberRoutes = require('./routes/member.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const orderRoutes = require('./routes/order.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app') || origin.includes('sadab.site') || config.corsOrigin === '*') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Capture raw body for Webhook signature verification before JSON parsing
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'QrParky Production API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting (/api/v1)
const API_PREFIX = '/api/v1';
app.use(API_PREFIX, authRoutes);
app.use(API_PREFIX, societyRoutes);
app.use(API_PREFIX, memberRoutes);
app.use(API_PREFIX, vehicleRoutes);
app.use(API_PREFIX, orderRoutes);
app.use(API_PREFIX, dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
