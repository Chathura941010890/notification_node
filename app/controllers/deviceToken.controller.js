const DeviceToken = require('../models/deviceToken.model');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

// Register a new device token
const registerDeviceToken = async (req, res, next) => {
    try {
        const { email, deviceToken, platform, appVersion } = req.body;
        const correlationId = req.correlationId;

        // Validate platform
        const validPlatforms = ['ios', 'android', 'web'];
        if (!validPlatforms.includes(platform)) {
            return next(new AppError('Invalid platform. Must be ios, android, or web', 400));
        }

        // Check if device token already exists
        const existingToken = await DeviceToken.findOne({
            where: { device_token: deviceToken }
        });

        if (existingToken) {
            // Update existing token
            await DeviceToken.update(
                {
                    email,
                    platform,
                    app_version: appVersion,
                    is_active: true,
                    last_seen: new Date(),
                    updated_at: new Date()
                },
                { where: { device_token: deviceToken } }
            );

            logger.info('Device token updated successfully', {
                correlationId,
                email,
                platform,
                tokenId: existingToken.id
            });

            return res.status(200).json({
                success: true,
                message: 'Device token updated successfully',
                tokenId: existingToken.id,
                correlationId
            });
        }

        // Create new device token
        const newToken = await DeviceToken.create({
            email,
            device_token: deviceToken,
            platform,
            app_version: appVersion,
            is_active: true,
            last_seen: new Date()
        });

        logger.info('Device token registered successfully', {
            correlationId,
            email,
            platform,
            tokenId: newToken.id
        });

        res.status(201).json({
            success: true,
            message: 'Device token registered successfully',
            tokenId: newToken.id,
            correlationId
        });

    } catch (error) {
        logger.error('Error registering device token', {
            correlationId: req.correlationId,
            error: error.message,
            email: req.body.email
        });
        next(error);
    }
};

// Unregister device token
const unregisterDeviceToken = async (req, res, next) => {
    try {
        const { deviceToken } = req.params;
        const correlationId = req.correlationId;

        const result = await DeviceToken.update(
            { is_active: false, updated_at: new Date() },
            { where: { device_token: deviceToken } }
        );

        if (result[0] === 0) {
            return next(new AppError('Device token not found', 404));
        }

        logger.info('Device token unregistered successfully', {
            correlationId,
            deviceToken: deviceToken.substring(0, 20) + '...'
        });

        res.status(200).json({
            success: true,
            message: 'Device token unregistered successfully',
            correlationId
        });

    } catch (error) {
        next(error);
    }
};

// Update device token activity (heartbeat)
const updateDeviceActivity = async (req, res, next) => {
    try {
        const { deviceToken } = req.params;
        const { appVersion } = req.body;
        const correlationId = req.correlationId;

        const exist = await DeviceToken.findOne({
           where: { device_token: deviceToken } 
        })

        if(!exist){
          return next(new AppError('Device token not found', 404));
        }

        const result = await DeviceToken.update(
            { 
                last_seen: new Date(),
                app_version: appVersion,
                is_active: true,
                updated_at: new Date()
            },
            { where: { device_token: deviceToken } }
        );

        // if (result[0] === 0) {
        // }

        // Get missed notifications for this device
        const deviceRecord = await DeviceToken.findOne({
            where: { 
              device_token: deviceToken 
            }
        });

        if (deviceRecord) {
            const missedNotifications = await notificationService.getMissedNotifications(
                deviceRecord.email, 
                deviceToken,
                20 // Last 20 notifications
            );

            res.status(200).json({
                success: true,
                message: 'Device activity updated',
                missedNotifications,
                missedCount: missedNotifications.length,
                correlationId
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Device activity updated',
                correlationId
            });
        }

    } catch (error) {
        next(error);
    }
};

// Get user's registered devices
const getUserDevices = async (req, res, next) => {
    try {
        const email = req.body.user;
        const correlationId = req.correlationId;

        const devices = await DeviceToken.findAll({
            where: { 
                email,
                is_active: true 
            },
            attributes: ['id', 'platform', 'app_version', 'last_seen', 'created_at'],
            order: [['last_seen', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: devices,
            count: devices.length,
            correlationId
        });

    } catch (error) {
        next(error);
    }
};

// Get missed notifications
const getMissedNotifications = async (req, res, next) => {
    try {
        const { deviceToken, limit = 50 } = req.query;
        const correlationId = req.correlationId;

        if (!deviceToken) {
            return next(new AppError('Device token is required', 400));
        }

        // Find the device token record to get the associated email
        const deviceRecord = await DeviceToken.findOne({
            where: { device_token: deviceToken, is_active: true }
        });

        if (!deviceRecord) {
            return next(new AppError('Device token not found or inactive', 404));
        }

        const email = deviceRecord.email;

        // Update last seen
        await notificationService.updateDeviceLastSeen(deviceToken, email);

        // Get missed notifications
        const missedNotifications = await notificationService.getMissedNotifications(
            email, 
            deviceToken, 
            parseInt(limit)
        );

        logger.info('Fetched missed notifications', {
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

        
        const email = req.body.user; // Get from request body
        const { notificationId } = req.params;
        const correlationId = req.correlationId;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'User email is required in request body',
                correlationId
            });
        }

        if (!notificationId) {
            return res.status(400).json({
                success: false,
                error: 'Notification ID is required',
                correlationId
            });
        }

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
                error: 'Notification not found or email mismatch',
                correlationId,
                debug: {
                    notificationId: parseInt(notificationId),
                    email
                }
            });
        }

    } catch (error) {
        console.log("Error in markNotificationAsRead:", error);
        next(error);
    }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const email = req.body.user;
        const notificationIds = req.body.notificationIds; // Optional: array of specific IDs
        const correlationId = req.correlationId;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'User email is required in request body',
                correlationId
            });
        }

        logger.info('Marking notifications as read:', {
            correlationId,
            email,
            notificationIds,
            isSpecific: !!notificationIds
        });

        console.log("Request data:", { email, notificationIds });

        const result = await notificationService.markAllNotificationsAsRead(email, notificationIds);

        const message = notificationIds && notificationIds.length > 0 
            ? `${result} specific notifications marked as read`
            : `${result} notifications marked as read`;

        res.status(200).json({
            success: true,
            message,
            count: result,
            correlationId
        });

    } catch (error) {
        logger.error('Error in markAllNotificationsAsRead controller:', {
            correlationId: req.correlationId,
            error: error.message,
            email: req.body.user,
            notificationIds: req.body.notificationIds
        });
        next(error);
    }
};

module.exports = {
    registerDeviceToken,
    unregisterDeviceToken,
    updateDeviceActivity,
    getUserDevices,
    getMissedNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};