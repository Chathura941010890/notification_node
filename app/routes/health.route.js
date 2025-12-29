const express = require('express');
const router = express.Router();
const sequelize = require('../db_con');
const emailService = require('../services/emailService');
const config = require('../config');

const checkDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        return { status: 'healthy', message: 'Database connection successful' };
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
};

const checkEmailService = async () => {
    try {
        // Simple check to see if transporter is configured
        const isConfigured = emailService.transporter && emailService.transporter.options;
        return { 
            status: isConfigured ? 'healthy' : 'unhealthy', 
            message: isConfigured ? 'Email service ready' : 'Email service not configured' 
        };
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
};

const checkRedisConnection = async () => {
    try {
        // If Redis is configured, check connection
        if (config.redis && config.redis.host) {
            const redis = require('../db_con/redisClient');
            if (redis && redis.ping) {
                await redis.ping();
                return { status: 'healthy', message: 'Redis connection successful' };
            }
        }
        return { status: 'not_configured', message: 'Redis not configured' };
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
};

const checkKafkaConnection = async () => {
    try {
        // Check if Kafka is configured
        if (config.kafka && config.kafka.brokers) {
            return { status: 'configured', message: 'Kafka configuration found' };
        }
        return { status: 'not_configured', message: 'Kafka not configured' };
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
};

const checkFirebaseService = async () => {
    try {
        // Check if Firebase is configured
        if (config.firebase && config.firebase.projectId) {
            return { status: 'configured', message: 'Firebase configuration found' };
        }
        return { status: 'not_configured', message: 'Firebase not configured' };
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
};

const getSystemInfo = () => {
    return {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
        pid: process.pid,
        environment: process.env.NODE_ENV || 'development'
    };
};

router.get('/', async (req, res) => {
    try {
        const [dbStatus, emailStatus, redisStatus, kafkaStatus, firebaseStatus] = await Promise.all([
            checkDatabaseConnection(),
            checkEmailService(),
            checkRedisConnection(),
            checkKafkaConnection(),
            checkFirebaseService()
        ]);

        const systemInfo = getSystemInfo();

        // Determine overall health status
        const criticalServices = [dbStatus, emailStatus];
        const isCriticalHealthy = criticalServices.every(service => service.status === 'healthy');
        
        const overallStatus = isCriticalHealthy ? 'healthy' : 'unhealthy';

        res.status(overallStatus === 'healthy' ? 200 : 503).json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId,
            system: systemInfo,
            services: {
                database: dbStatus,
                email: emailStatus,
                redis: redisStatus,
                kafka: kafkaStatus,
                firebase: firebaseStatus
            },
            summary: {
                healthy: Object.values({
                    database: dbStatus,
                    email: emailStatus,
                    redis: redisStatus,
                    kafka: kafkaStatus,
                    firebase: firebaseStatus
                }).filter(s => s.status === 'healthy').length,
                unhealthy: Object.values({
                    database: dbStatus,
                    email: emailStatus,
                    redis: redisStatus,
                    kafka: kafkaStatus,
                    firebase: firebaseStatus
                }).filter(s => s.status === 'unhealthy').length,
                not_configured: Object.values({
                    database: dbStatus,
                    email: emailStatus,
                    redis: redisStatus,
                    kafka: kafkaStatus,
                    firebase: firebaseStatus
                }).filter(s => s.status === 'not_configured' || s.status === 'configured').length
            }
        });

    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId,
            error: error.message,
            system: getSystemInfo()
        });
    }
});

// Detailed health check endpoint
router.get('/detailed', async (req, res) => {
    try {
        const healthChecks = {
            database: await checkDatabaseConnection(),
            email: await checkEmailService(),
            redis: await checkRedisConnection(),
            kafka: await checkKafkaConnection(),
            firebase: await checkFirebaseService()
        };

        const systemInfo = getSystemInfo();

        res.json({
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId,
            system: systemInfo,
            services: healthChecks,
            config: {
                port: config.server?.port || process.env.PORT,
                environment: process.env.NODE_ENV,
                database: {
                    host: config.database?.host,
                    name: config.database?.database,
                    dialect: config.database?.dialect
                },
                email: {
                    host: config.email?.host,
                    port: config.email?.port,
                    secure: config.email?.secure
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId
        });
    }
});

module.exports = router;
