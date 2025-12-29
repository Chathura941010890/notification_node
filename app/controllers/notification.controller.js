const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// Get missed notifications when user comes back online
const getMissedNotifications = async (req, res, next) => {
    try {
        const { email } = req.user; // From JWT token
        const { deviceToken, limit = 50 } = req.query;
        const correlationId = req.correlationId;

        if (!deviceToken) {
            return res.status(400).json({
                success: false,
                error: 'Device token is required'
            });
        }

        // Update last seen
        await notificationService.updateDeviceLastSeen(deviceToken, email);

        // Get missed notifications
        const missedNotifications = await notificationService.getMissedNotifications(
            email, 
            deviceToken, 
            parseInt(limit)
        );

        logger.info('Fetched missed notifications:', {
            correlationId,
            email,
            count: missedNotifications.length
        });

        res.status(200).json({
            success: true,
            data: missedNotifications,
            count: missedNotifications.length,
            correlationId
        });

    } catch (error) {
        next(error);
    }
};

// Mark notification as read
const markNotificationAsRead = async (req, res, next) => {
    try {
        console.log("AAAAAAAAAAAAAAAAAa ", req.body);
        
        const  email  = req.body.user; 
        const { notificationId } = req.params;
        const correlationId = req.correlationId;

        const success = await notificationService.markNotificationAsRead(
            parseInt(notificationId), 
            email
        );

        if (success) {
            res.status(200).json({
                success: true,
                message: 'Notification marked as read',
                correlationId
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Notification not found',
                correlationId
            });
        }

    } catch (error) {
        next(error);
    }
};

// Send notification (existing endpoint enhanced)
const sendNotificationController = async (req, res, next) => {
    try {
        const correlationId = req.correlationId;
        const data = JSON.stringify(req.body);

        const result = await notificationService.sendNotification(data, correlationId);

        res.status(200).json({
            success: true,
            message: 'Notifications processed',
            data: result,
            correlationId
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMissedNotifications,
    markNotificationAsRead,
    sendNotificationController
};