const express = require('express');
const router = express.Router();
const { notificationRateLimiter } = require('../middleware/rateLimiter');
const {
    getMissedNotifications,
    markNotificationAsRead,
    sendNotificationController
} = require('../controllers/notification.controller');

// Get missed notifications when user comes back online
router.get('/missed', 
    notificationRateLimiter,
    getMissedNotifications
);

// Mark notification as read
router.put('/:notificationId/readX', 
    notificationRateLimiter,
    markNotificationAsRead
);

// Send notification
router.post('/send', 
    notificationRateLimiter,
    sendNotificationController
);

module.exports = router;