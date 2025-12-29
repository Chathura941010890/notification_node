const path = require('path');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS',
    'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
    'JWT_SECRET_KEY',
    'FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Some features may not work properly. Please check your .env file.');
}

const config = {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'notification_service',
        username: process.env.DB_USER || 'stocktakeadmin',
        password: process.env.DB_PASS || 'In@ubeStkT@k@dmin',
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
        }
    },
    
    email: {
        smtp: {
            service: 'outlook',
            auth: {
                user: process.env.SMTP_USER || 'noreply@inqube.com',
                pass: process.env.SMTP_PASS || 'lnQub3inf1nIt7'
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5
        },
        retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY) || 5000
    },
    
    firebase: {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID || '',
        private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
        client_email: process.env.FIREBASE_CLIENT_EMAIL || '',
        client_id: process.env.FIREBASE_CLIENT_ID || '',
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
    },
    
    jwt: {
        secret: process.env.JWT_SECRET_KEY || 'fallback-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    
    kafka: {
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
        groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group'
    },
    
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    }
};

module.exports = config;
