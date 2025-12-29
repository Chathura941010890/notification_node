// Load environment variables first, before any other imports
const { loadEnvironment } = require('./app/utils/envLoader');
loadEnvironment();

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./app/routes/index');
const logger = require('./app/utils/logger');
const config = require('./app/config');
const documentationRoute = require('./app/routes/documentation');
const notificationRoute = require("./app/routes/notification.route");

const { consumeMessageFromKafka } = require('./app/kafka/controller');
const { setupFCM } = require('./app/firebase/setup/setup');
const { errorHandler, notFound } = require('./app/middleware/errorHandler');
const {callDecrypt} = require('./app/utils/AESEncrypt');

const app = express();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
        promise: promise.toString(),
        reason: reason.toString(),
        stack: reason.stack,
        timestamp: new Date().toISOString()
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    process.exit(1);
});

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// CORS Configuration
let allowedOrigins = [];

// Load CORS origins from environment variable
if (process.env.CORS_ALLOWED_ORIGINS) {
    allowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
} else {
    // Fallback to default origins if env variable is not set
    allowedOrigins = [
        'https://apigateway.inqcloud.com:49170', 
        'https://backoffice.inqcloud.com:49171', 
        
        'http://172.33.0.107:49170',
        'http://172.33.0.107:49171', 
    ];
}

// Middleware to dynamically update CORS origins
app.use(cors({    
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Block common API testing tools
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  if (userAgent.includes('Postman') || 
      userAgent.includes('Insomnia') || 
      userAgent.includes('curl')) {
    return res.status(403).json({ error: 'API testing tools are not allowed' });
  }
  
  next();
});

// Middleware to validate API key (commented out for localhost development)
app.use(async (req, res, next) => {
    if (!req.headers['x-api-key']) {
      return res.status(403).send('Forbidden');
    }
  
    try {
      const { key, code } = JSON.parse(req.headers['x-api-key']);
      const decryptValue = await callDecrypt(key, code.toString());
        
      if (!key || !code || decryptValue != "success") {
        return res.status(403).send('Forbidden');
      }
  
      next();
    } catch (error) {
      return res.status(403).send('Forbidden');
    }
});

// Legacy health check endpoint
const utilfuctions = require('./app/utils/utilfuctions');
app.get('/healthCheck', utilfuctions.healthCheck);

// Routes
app.use('/notification/api/v1', routes, documentationRoute, notificationRoute);

// 404 handler for undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
    try {
        // Connect to Kafka and start consuming
        await consumeMessageFromKafka();
        logger.info('Kafka consumer initialized successfully');

        // Connect to Firebase
        // await setupFCM();
        // logger.info('Firebase initialized successfully');

    } catch (error) {
        logger.error('Failed to initialize services', { error: error.message });
        process.exit(1);
    }
};

// Start server
app.listen(config.port, async () => {
    logger.info('Notification service started', { 
        port: config.port,
        environment: config.environment,
        nodeVersion: process.version
    });

    // Initialize services after server starts
    await initializeServices();
});
