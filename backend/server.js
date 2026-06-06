const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const paymentRoutes = require('./routes/payment');

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(helmet());
app.use(compression());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 600),
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 logins per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Database Connection will be initialized in startServer()

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve React frontend build when available
let frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
if (!fs.existsSync(frontendBuildPath)) {
  frontendBuildPath = path.join(__dirname, 'public');
}

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in your .env file.');
    }
    
    console.log('Attempting to connect to MongoDB...');
    // Connect to DB and fail fast if the IP is blocked
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 
    });
    console.log('MongoDB connected successfully!');

    // Start Express only after DB connects
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // start whatsapp scheduler if enabled
      try {
        const scheduler = require('./scheduler/whatsappScheduler');
        scheduler.start();
      } catch (e) {
        console.warn('WhatsApp scheduler not started', e.message || e);
      }

      // start daily report scheduler if explicitly enabled
      if (process.env.ENABLE_DAILY_REPORT_SCHEDULER === 'true') {
        try {
          const dailyReportScheduler = require('./scheduler/dailyReportScheduler');
          dailyReportScheduler.start();
        } catch (e) {
          console.warn('Daily report scheduler not started', e.message || e);
        }
      }
    });
  } catch (err) {
    console.error('CRITICAL: Failed to start server due to MongoDB connection error!');
    console.error(err);
    process.exit(1); // Exit process immediately
  }
};

startServer();
