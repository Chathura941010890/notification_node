const express = require('express');
const router = express.Router();

// Import middleware
const { addCorrelationId, addSecurityHeaders } = require('../middleware/common');
const { generalRateLimiter, emailRateLimiter } = require('../middleware/rateLimiter');
const { validateEmailData, validateTopicParam } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Import controllers
const { 
    sendEmailController, 
    retryFailedEmailsController, 
    getEmailStatsController,
    getEmailLogsController 
} = require('../controllers/email.controller');

// Import route modules
const healthRoutes = require('./health.route');
const deviceTokenRoutes = require('./deviceToken.route');

// Apply global middleware
router.use(addCorrelationId);
router.use(addSecurityHeaders);
router.use(generalRateLimiter);

// Health check routes (no auth required)
router.use('/health', healthRoutes);

// Email routes
router.post('/email/send', 
    emailRateLimiter, 
    optionalAuth, 
    validateEmailData, 
    sendEmailController
);

router.post('/email/retry/:topic', 
    emailRateLimiter, 
    optionalAuth, 
    validateTopicParam, 
    retryFailedEmailsController
);

router.get('/email/stats', 
    optionalAuth, 
    getEmailStatsController
);

router.get('/email/logs', 
    optionalAuth, 
    getEmailLogsController
);

// Device token routes
router.use('/device-tokens', deviceTokenRoutes);


module.exports = router; 