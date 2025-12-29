const express = require('express');
const router = express.Router();
const { notificationRateLimiter } = require('../middleware/rateLimiter');
const { validateDeviceRegistration, validateDeviceToken } = require('../middleware/validation');
const {
    registerDeviceToken,
    unregisterDeviceToken,
    updateDeviceActivity,
    getUserDevices,
    getMissedNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../controllers/deviceToken.controller');

// Register device token (public endpoint for registration)
router.post('/register', 
    notificationRateLimiter,
    validateDeviceRegistration,
    registerDeviceToken
);

// Unregister device token (public endpoint)
router.delete('/:deviceToken', 
    notificationRateLimiter,
    validateDeviceToken,
    unregisterDeviceToken
);

// Update device activity / heartbeat (public endpoint)
router.put('/:deviceToken/activity', 
    notificationRateLimiter,
    validateDeviceToken,
    updateDeviceActivity
);

// Get user's registered devices (requires auth)
router.get('/my-devices', 
    notificationRateLimiter,
    getUserDevices
);

// Get missed notifications (requires auth)
router.get('/missed-notifications', 
    notificationRateLimiter,
    getMissedNotifications
);

// Mark notification as read (requires auth)
router.put('/notifications/:notificationId/read', 
    notificationRateLimiter,
    markNotificationAsRead
);

// Mark all notifications as read (requires auth)
router.put('/notifications/read-all', 
    notificationRateLimiter,
    markAllNotificationsAsRead
);

module.exports = router;