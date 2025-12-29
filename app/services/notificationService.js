const admin = require("firebase-admin");
const DeviceToken = require("../models/deviceToken.model");
const NotificationHistory = require("../models/notificationHistory.model");
const logger = require("../utils/logger");
const { Sequelize, Op } = require("sequelize");

// Initialize Firebase if not already initialized
function initializeFirebaseIfNeeded() {
    if (!admin.apps.length) {
        try {
            const serviceAccount = require("../firebase/config/inqube-notification-service-firebase-adminsdk.json");
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            logger.info("Firebase initialized in notification service");
        } catch (error) {
            logger.error("Failed to initialize Firebase in notification service:", error.message);
            throw error;
        }
    }
    return admin;
}

class NotificationService {
    constructor() {
        this.batchSize = 500; // FCM multicast limit
        this.maxRetries = 3;
        this.retryDelay = 5000;
        
        // Ensure Firebase is initialized
        initializeFirebaseIfNeeded();
    }

    async sendNotification(data, correlationId = null) {
        logger.debug("Raw notification data received:", { 
            correlationId,
            dataType: typeof data,
            dataContent: data,
            dataLength: data ? data.length : 0
        });

        const { emails, title, body, data: customData, priority = 'normal', ttl = 86400 } = JSON.parse(data);

        logger.info("Parsed notification data:", {
            correlationId,
            emails,
            title,
            body,
            customData,
            priority,
            ttl
        });

        if (!emails || !Array.isArray(emails) || !title || !body) {
            const error = new Error("Missing or invalid required fields.");
            logger.error("Notification validation failed:", {
                correlationId,
                emails: emails || "missing",
                title: title || "missing", 
                body: body || "missing",
                emailsIsArray: Array.isArray(emails)
            });
            throw error;
        }

        try {
            // Fetch active device tokens for the specified emails
            logger.debug("Searching for device tokens:", {
                correlationId,
                emails,
                emailCount: emails.length
            });

            const deviceTokens = await DeviceToken.findAll({
                where: {
                    email: { [Op.in]: emails },
                    is_active: true
                }
            });

            logger.info("Device tokens found:", {
                correlationId,
                tokenCount: deviceTokens.length,
                emails,
                foundEmails: deviceTokens.map(dt => dt.email)
            });

            if (deviceTokens.length === 0) {
                logger.warn("No active device tokens found for the provided emails.", {
                    correlationId,
                    emails
                });
                return { success: false, message: "No active device tokens found" };
            }

            // Create notification history records
            const expiresAt = new Date(Date.now() + (ttl * 1000));
            const historyRecords = await Promise.all(
                deviceTokens.map(dt => 
                    NotificationHistory.create({
                        correlation_id: correlationId,
                        email: dt.email,
                        device_token: dt.device_token,
                        title,
                        body,
                        data: customData || {},
                        priority,
                        expires_at: expiresAt,
                        status: 'pending'
                    })
                )
            );

            // Send notifications in batches with history records
            const results = await this.sendBatchNotifications(deviceTokens, title, body, customData, priority, ttl, correlationId, historyRecords);

            // Update history records with results
            await this.updateNotificationHistory(historyRecords, results);

            return {
                success: true,
                totalSent: results.filter(r => r.success).length,
                totalFailed: results.filter(r => !r.success).length,
                results
            };

        } catch (error) {
            logger.error("Error in sendNotification:", {
                correlationId,
                error: error.message,
                emails
            });
            throw error;
        }
    }

    async sendBatchNotifications(deviceTokens, title, body, customData, priority, ttl, correlationId, historyRecords) {
        const results = [];
        
        for (let i = 0; i < deviceTokens.length; i += this.batchSize) {
            const batch = deviceTokens.slice(i, i + this.batchSize);
            const batchHistoryRecords = historyRecords.slice(i, i + this.batchSize);
            const batchResults = await this.sendNotificationBatch(batch, title, body, customData, priority, ttl, correlationId, batchHistoryRecords);
            results.push(...batchResults);
        }

        return results;
    }

    async sendNotificationBatch(deviceTokens, title, body, customData, priority, ttl, correlationId, historyRecords) {
        // Ensure all data values are strings (Firebase requirement)
        const stringifiedData = {};
        if (customData && typeof customData === 'object') {
            Object.keys(customData).forEach(key => {
                stringifiedData[key] = typeof customData[key] === 'string' 
                    ? customData[key] 
                    : JSON.stringify(customData[key]);
            });
        }

        try {
            logger.info("Sending batch notification:", {
                correlationId,
                tokenCount: deviceTokens.length,
                title,
                body
            });

            // Ensure Firebase is initialized
            const messaging = initializeFirebaseIfNeeded().messaging();
            
            // Send individual notifications with their respective history IDs
            const notificationResults = [];
            
            for (let i = 0; i < deviceTokens.length; i++) {
                const deviceToken = deviceTokens[i];
                const historyRecord = historyRecords[i];                
                
                const message = {
                    token: deviceToken.device_token,
                    notification: { title, body },
                    data: {
                        deviceToken: deviceToken.device_token,
                        ...stringifiedData,
                        correlationId: correlationId || '',
                        timestamp: Date.now().toString(),
                        id: historyRecord.id.toString() // Include the notification history ID
                    },
                    android: {
                        priority: priority === 'high' ? 'high' : 'normal',
                        ttl: ttl * 1000, // Convert to milliseconds
                        notification: {
                            click_action: 'FLUTTER_NOTIFICATION_CLICK',
                            priority: priority === 'high' ? 'high' : 'default'
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                badge: 1,
                                sound: 'default',
                                'content-available': 1
                            }
                        },
                        headers: {
                            'apns-priority': priority === 'high' ? '10' : '5',
                            'apns-expiration': (Math.floor(Date.now() / 1000) + ttl).toString()
                        }
                    },
                    webpush: {
                        headers: {
                            TTL: ttl.toString()
                        },
                        notification: {
                            icon: '/icon-192x192.png',
                            badge: '/badge-72x72.png',
                            requireInteraction: priority === 'high'
                        }
                    }
                };

                try {
                    const response = await messaging.send(message);
                    notificationResults.push({
                        deviceToken: deviceToken,
                        success: true,
                        messageId: response,
                        deliveryStatus: 'online',
                        historyId: historyRecord.id
                    });
                    
                    logger.debug("Individual notification sent successfully:", {
                        correlationId,
                        email: deviceToken.email,
                        historyId: historyRecord.id,
                        messageId: response
                    });
                    
                } catch (error) {
                    notificationResults.push({
                        deviceToken: deviceToken,
                        success: false,
                        error: error,
                        deliveryStatus: 'offline',
                        historyId: historyRecord.id
                    });
                    
                    logger.error("Individual notification failed:", {
                        correlationId,
                        email: deviceToken.email,
                        historyId: historyRecord.id,
                        error: error.message
                    });
                }
            }
            
            logger.info("Batch notification completed:", {
                correlationId,
                successCount: notificationResults.filter(r => r.success).length,
                failureCount: notificationResults.filter(r => !r.success).length,
                historyIds: notificationResults.map(r => r.historyId)
            });

            // Handle failed tokens
            await this.handleFailedTokens(notificationResults, correlationId);

            return notificationResults;

        } catch (error) {
            logger.error("Batch notification send failed:", {
                correlationId,
                error: error.message,
                tokenCount: deviceTokens.length
            });

            return deviceTokens.map((dt, index) => ({
                deviceToken: dt,
                success: false,
                error: { message: error.message },
                deliveryStatus: 'unknown',
                historyId: historyRecords[index].id
            }));
        }
    }

    async handleFailedTokens(results, correlationId) {
        const invalidTokens = results
            .filter(result => !result.success && this.isTokenInvalid(result.error))
            .map(result => result.deviceToken.device_token);

        if (invalidTokens.length > 0) {
            await DeviceToken.update(
                { is_active: false },
                { where: { device_token: { [Op.in]: invalidTokens } } }
            );

            logger.info("Deactivated invalid tokens:", {
                correlationId,
                count: invalidTokens.length
            });
        }
    }

    isTokenInvalid(error) {
        if (!error) return false;
        
        const invalidCodes = [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token'
        ];
        
        return invalidCodes.includes(error.code);
    }

    async updateNotificationHistory(historyRecords, results) {
        for (let i = 0; i < historyRecords.length; i++) {
            const record = historyRecords[i];
            const result = results[i];

            const updateData = {
                status: result.success ? 'sent' : 'failed',
                delivery_status: result.deliveryStatus,
                fcm_message_id: result.messageId,
                error_message: result.error ? result.error.message : null,
                sent_at: result.success ? new Date() : null,
                updated_at: new Date()
            };

            await NotificationHistory.update(updateData, { where: { id: record.id } });
        }
    }

    // Get missed notifications for a user when they come back online
    async getMissedNotifications(email, deviceToken, limit = 50) {
        try {
            const missedNotifications = await NotificationHistory.findAll({
                where: {
                    email,
                    status: { [Op.in]: ['pending', 'failed', 'sent'] },
                    expires_at: { [Op.gt]: new Date() },
                    created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                },
                order: [['created_at', 'DESC']],
                limit
            });

            return missedNotifications.map(notification => ({
                id: notification.id,
                title: notification.title,
                body: notification.body,
                data: notification.data,
                createdAt: notification.created_at,
                priority: notification.priority,
                deviceToken: notification.device_token
            }));

        } catch (error) {
            logger.error("Error fetching missed notifications:", {
                email,
                error: error.message
            });
            return [];
        }
    }

    // Update device token last seen when user comes online
    async updateDeviceLastSeen(deviceToken, email) {
        try {
            await DeviceToken.update(
                { 
                    last_seen: new Date(),
                    is_active: true
                },
                { 
                    where: { 
                        device_token: deviceToken,
                        email 
                    } 
                }
            );

            return true;
        } catch (error) {
            logger.error("Error updating device last seen:", {
                deviceToken,
                email,
                error: error.message
            });
            return false;
        }
    }

    // Mark notification as delivered/read
    async markNotificationAsRead(notificationId, email) {
        try {
            logger.info("Attempting to mark notification as read:", {
                notificationId,
                email
            });

            const result = await NotificationHistory.update(
                { 
                    read_at: new Date(),
                    status: 'delivered'
                },
                { 
                    where: { 
                        id: notificationId,
                        email: email  // Use the parameter, not hardcoded value!
                    } 
                }
            );

            logger.info("Mark as read result:", {
                notificationId,
                email,
                affectedRows: result[0]
            });

            return result[0] > 0;  // Return true if any rows were affected
        } catch (error) {
            logger.error("Error marking notification as read:", {
                notificationId,
                email,
                error: error.message
            });
            return false;
        }
    }

    // Mark all notifications as read for a user
    async markAllNotificationsAsRead(email, notificationIds = null) {
        try {
            logger.info("Marking notifications as read:", {
                email,
                notificationIds,
                isSpecificIds: !!notificationIds
            });

            // Build the where clause
            const whereClause = { email };
            
            if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
                // Mark specific notifications as read
                whereClause.id = { [Op.in]: notificationIds };
            } else {
                // Mark all unread notifications as read
                whereClause.status = { [Op.in]: ['pending', 'sent', 'failed'] };
                whereClause.read_at = { [Op.is]: null };
            }

            const result = await NotificationHistory.update(
                { 
                    read_at: new Date(),
                    status: 'delivered'
                },
                { where: whereClause }
            );

            logger.info("Mark all as read result:", {
                email,
                affectedRows: result[0],
                notificationIds
            });

            return result[0];
        } catch (error) {
            logger.error("Error marking all notifications as read:", {
                email,
                notificationIds,
                error: error.message
            });
            return 0;
        }
    }

    // Clean up expired notifications
    async cleanupExpiredNotifications() {
        try {
            const result = await NotificationHistory.destroy({
                where: {
                    expires_at: { [Op.lt]: new Date() }
                }
            });

            logger.info("Cleaned up expired notifications:", { count: result });
            return result;

        } catch (error) {
            logger.error("Error cleaning up expired notifications:", {
                error: error.message
            });
            return 0;
        }
    }

    // Clean up old device tokens
    async cleanupOldDeviceTokens(daysInactive = 7) {
        try {
            const cutoffDate = new Date(Date.now() - (daysInactive * 24 * 60 * 60 * 1000));
            
            // First, deactivate old tokens
            const deactivateResult = await DeviceToken.update(
                { is_active: false },
                {
                    where: {
                        [Op.or]: [
                            { last_seen: { [Op.lt]: cutoffDate } },
                            { last_seen: { [Op.is]: null } }
                        ],
                        is_active: true
                    }
                }
            );

            // Then remove very old inactive tokens (older than daysInactive + 7 days)
            const removalCutoffDate = new Date(Date.now() - ((daysInactive + 7) * 24 * 60 * 60 * 1000));
            const removeResult = await DeviceToken.destroy({
                where: {
                    [Op.and]: [
                        { is_active: false },
                        {
                            [Op.or]: [
                                { last_seen: { [Op.lt]: removalCutoffDate } },
                                { last_seen: { [Op.is]: null } }
                            ]
                        }
                    ]
                }
            });

            logger.info("Device token cleanup completed:", {
                deactivated: deactivateResult[0],
                removed: removeResult,
                daysInactive
            });

            return {
                deactivated: deactivateResult[0],
                removed: removeResult
            };

        } catch (error) {
            logger.error("Error cleaning up old device tokens:", {
                error: error.message,
                daysInactive
            });
            return { deactivated: 0, removed: 0 };
        }
    }
}

module.exports = new NotificationService();