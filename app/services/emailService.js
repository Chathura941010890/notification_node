const nodemailer = require('nodemailer');
const config = require('../config');
const EmailLog = require('../models/emailLog.model');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport(config.email.smtp);
        this.maxRetries = config.email.retryAttempts;
        this.retryDelay = config.email.retryDelay;
    }

    async sendEmail(options, correlationId = null) {
        const startTime = Date.now();
        try {
            const mailOptions = {
                from: options.from || config.email.smtp.auth.user,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc || '',
                bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc || '',
                subject: options.subject,
                text: options.text || '',
                html: options.html || ''
            };
            // Add attachments if provided
            if (options.attachments && Array.isArray(options.attachments) && options.attachments.length > 0) {
                mailOptions.attachments = options.attachments;
            }

            const info = await this.transporter.sendMail(mailOptions);
            const duration = Date.now() - startTime;

            logger.info('Email sent successfully', {
                correlationId,
                messageId: info.messageId,
                recipients: options.to,
                subject: options.subject,
                duration,
                attachmentsCount: options.attachments ? options.attachments.length : 0
            });

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Failed to send email', {
                correlationId,
                error: error.message,
                recipients: options.to,
                subject: options.subject,
                duration,
                attachmentsCount: options.attachments ? options.attachments.length : 0
            });

            throw new AppError(`Failed to send email: ${error.message}`, 500);
        }
    }

    async sendEmailWithRetry(options, correlationId = null) {
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await this.sendEmail(options, correlationId);
                
                if (attempt > 1) {
                    logger.info('Email sent successfully after retry', {
                        correlationId,
                        attempt,
                        recipients: options.to
                    });
                }

                return result;

            } catch (error) {
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    
                    logger.warn('Email send failed, retrying', {
                        correlationId,
                        attempt,
                        nextRetryIn: delay,
                        error: error.message
                    });

                    await this.delay(delay);
                } else {
                    logger.error('Email send failed after all retries', {
                        correlationId,
                        attempts: this.maxRetries,
                        error: error.message
                    });
                }
            }
        }

        throw lastError;
    }

    async logEmailAttempt(options, status, errorMessage = null, correlationId = null) {
        try {
            await EmailLog.create({
                correlation_id: correlationId,
                topic: options.topic || 'unknown',
                recipients: JSON.stringify(options.to),
                cc: JSON.stringify(options.cc || []),
                bcc: JSON.stringify(options.bcc || []),
                subject: options.subject || 'No Subject',
                text_content: options.text || '',
                html_content: options.html || '',
                status,
                error_message: errorMessage,
                created_at: new Date()
            });
        } catch (error) {
            logger.error('Failed to log email attempt', {
                correlationId,
                error: error.message
            });
        }
    }

    async retryFailedEmails(topic, correlationId = null) {
        try {
            const { Op } = require('sequelize');
            const failedEmails = await EmailLog.findAll({
                where: { 
                    topic, 
                    status: 'failure',
                    retry_count: { [Op.lt]: this.maxRetries }
                }
            });

            logger.info('Starting email retry process', {
                correlationId,
                topic,
                failedEmailsCount: failedEmails.length
            });

            let successCount = 0;
            let failureCount = 0;

            for (const failed of failedEmails) {
                try {
                    const retryOptions = {
                        to: JSON.parse(failed.recipients),
                        cc: JSON.parse(failed.cc || '[]'),
                        bcc: JSON.parse(failed.bcc || '[]'),
                        subject: failed.subject,
                        text: failed.text_content,
                        html: failed.html_content,
                        topic: failed.topic
                    };

                    await this.sendEmail(retryOptions, correlationId);

                    await EmailLog.update(
                        { 
                            status: 'success', 
                            error_message: null,
                            retry_count: (failed.retry_count || 0) + 1,
                            updated_at: new Date()
                        },
                        { where: { id: failed.id } }
                    );

                    successCount++;

                } catch (error) {
                    await EmailLog.update(
                        { 
                            retry_count: (failed.retry_count || 0) + 1,
                            error_message: error.message,
                            updated_at: new Date()
                        },
                        { where: { id: failed.id } }
                    );

                    failureCount++;
                }
            }

            logger.info('Email retry process completed', {
                correlationId,
                topic,
                totalProcessed: failedEmails.length,
                successCount,
                failureCount
            });

            return {
                totalProcessed: failedEmails.length,
                successCount,
                failureCount
            };

        } catch (error) {
            logger.error('Failed to retry emails', {
                correlationId,
                topic,
                error: error.message
            });
            throw new AppError(`Failed to retry emails: ${error.message}`, 500);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getEmailStats(topic = null, correlationId = null) {
        try {
            const { Op } = require('sequelize');
            const whereClause = topic ? { topic } : {};

            const stats = await EmailLog.findAll({
                where: whereClause,
                attributes: [
                    'status',
                    [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
                ],
                group: ['status'],
                raw: true
            });

            const result = {
                success: 0,
                failure: 0,
                total: 0
            };

            stats.forEach(stat => {
                result[stat.status] = parseInt(stat.count);
                result.total += parseInt(stat.count);
            });

            logger.info('Email stats retrieved', {
                correlationId,
                topic,
                stats: result
            });

            return result;

        } catch (error) {
            logger.error('Failed to get email stats', {
                correlationId,
                topic,
                error: error.message
            });
            throw new AppError(`Failed to get email stats: ${error.message}`, 500);
        }
    }

    async getEmailLogs(filters = {}, offset = 0, limit = 50) {
        try {
            const whereClause = {};

            // Apply filters
            if (filters.status) whereClause.status = filters.status;
            if (filters.topic) whereClause.topic = filters.topic;
            if (filters.correlation_id) whereClause.correlation_id = filters.correlation_id;
            if (filters.created_at) whereClause.created_at = filters.created_at;

            const logs = await EmailLog.findAll({
                where: whereClause,
                order: [['created_at', 'DESC']],
                offset: offset,
                limit: limit,
                attributes: [
                    'id',
                    'correlation_id',
                    'topic',
                    'recipients',
                    'cc',
                    'bcc',
                    'subject',
                    'status',
                    'error_message',
                    'retry_count',
                    'created_at',
                    'updated_at'
                ]
            });

            // Parse JSON fields for response
            return logs.map(log => ({
                id: log.id,
                correlationId: log.correlation_id,
                topic: log.topic,
                recipients: JSON.parse(log.recipients || '[]'),
                cc: JSON.parse(log.cc || '[]'),
                bcc: JSON.parse(log.bcc || '[]'),
                subject: log.subject,
                status: log.status,
                errorMessage: log.error_message,
                retryCount: log.retry_count,
                createdAt: log.created_at,
                updatedAt: log.updated_at
            }));

        } catch (error) {
            logger.error('Failed to get email logs', {
                error: error.message,
                filters
            });
            throw new AppError(`Failed to get email logs: ${error.message}`, 500);
        }
    }

    async getEmailLogsCount(filters = {}) {
        try {
            const whereClause = {};

            // Apply filters
            if (filters.status) whereClause.status = filters.status;
            if (filters.topic) whereClause.topic = filters.topic;
            if (filters.correlation_id) whereClause.correlation_id = filters.correlation_id;
            if (filters.created_at) whereClause.created_at = filters.created_at;

            return await EmailLog.count({
                where: whereClause
            });

        } catch (error) {
            logger.error('Failed to get email logs count', {
                error: error.message,
                filters
            });
            throw new AppError(`Failed to get email logs count: ${error.message}`, 500);
        }
    }
}

module.exports = new EmailService();
