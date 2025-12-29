const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

const sendEmailController = async (req, res, next) => {
    try {
        const { from, to, cc, bcc, subject, text, html, topic, attachments = [] } = req.body;
        const correlationId = req.correlationId;

        const options = {
            from,
            to,
            cc,
            bcc,
            subject,
            text,
            html,
            topic,
            attachments: attachments || []
        };

        // Send email with retry mechanism
        const result = await emailService.sendEmailWithRetry(options, correlationId);

        // Log successful email
        await emailService.logEmailAttempt(options, 'success', null, correlationId);

        logger.info('Email processing completed successfully', {
            correlationId,
            messageId: result.messageId,
            recipients: to.length,
            attachmentsCount: attachments ? attachments.length : 0
        });

        res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            messageId: result.messageId,
            correlationId
        });

    } catch (error) {
        const options = {
            from: req.body.from,
            to: req.body.to,
            cc: req.body.cc,
            bcc: req.body.bcc,
            subject: req.body.subject,
            text: req.body.text,
            html: req.body.html,
            topic: req.body.topic,
            attachments: req.body.attachments || []
        };

        // Log failed email
        await emailService.logEmailAttempt(options, 'failure', error.message, req.correlationId);

        next(error);
    }
};

const retryFailedEmailsController = async (req, res, next) => {
    try {
        const { topic } = req.params;
        const correlationId = req.correlationId;

        const result = await emailService.retryFailedEmails(topic, correlationId);

        res.status(200).json({
            success: true,
            message: `Retry process completed for topic: ${topic}`,
            correlationId,
            stats: result
        });

    } catch (error) {
        next(error);
    }
};

const getEmailStatsController = async (req, res, next) => {
    try {
        const { topic } = req.query;
        const correlationId = req.correlationId;

        const stats = await emailService.getEmailStats(topic, correlationId);

        res.status(200).json({
            success: true,
            correlationId,
            topic: topic || 'all',
            stats
        });

    } catch (error) {
        next(error);
    }
};

const normalizeAttachments = (attachments = []) =>
  attachments.map(att => {
    // Case 1: Base64 (recommended)
    if (att.contentBase64) {
      return {
        filename: att.filename,
        content: Buffer.from(att.contentBase64, att.encoding || 'base64'),
        contentType: att.contentType
      };
    }

    // Case 2: Kafka-serialized Buffer { type, data }
    if (att.content?.type === 'Buffer' && Array.isArray(att.content.data)) {
      return {
        filename: att.filename,
        content: Buffer.from(att.content.data),
        contentType: att.contentType
      };
    }

    // Case 3: Already valid
    return att;
  });


// Legacy function for backward compatibility (used by Kafka consumer)
const sendEmailLegacy = async (data) => {
    try {
        // Ensure data is parsed only if it's a string
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const { from, to, cc, bcc, subject, text, html, topic, attachments = [] } = parsedData;

        if (!to || !subject || (!text && !html)) {
            throw new Error('Required fields: to, subject, and either text or html.');
        }

        const normalizedAttachments = normalizeAttachments(attachments);

        const options = {
            from,
            to,
            cc,
            bcc,
            subject,
            text: text || '',
            html: html || '',
            topic,
            attachments: normalizedAttachments || []
        };

        const result = await emailService.sendEmailWithRetry(options);
        await emailService.logEmailAttempt(options, 'success');

        logger.info('Email sent successfully (legacy)', {
            recipients: to.length,
            topic,
            attachmentsCount: attachments ? attachments.length : 0
        });

        return result;

    } catch (error) {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        const options = {
            from: parsedData.from,
            to: parsedData.to,
            cc: parsedData.cc,
            bcc: parsedData.bcc,
            subject: parsedData.subject,
            text: parsedData.text,
            html: parsedData.html,
            topic: parsedData.topic,
            attachments: parsedData.attachments || []
        };

        await emailService.logEmailAttempt(options, 'failure', error.message);

        logger.error('Failed to send email (legacy)', {
            error: error.message,
            topic: parsedData.topic,
            attachmentsCount: parsedData.attachments ? parsedData.attachments.length : 0
        });

        throw new Error("Failed to send email!");
    }
};

const getEmailLogsController = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            status, 
            topic, 
            startDate, 
            endDate,
            correlationId: searchCorrelationId 
        } = req.query;

        const correlationId = req.correlationId;

        // Build filter options
        const filters = {};
        if (status) filters.status = status;
        if (topic) filters.topic = topic;
        if (searchCorrelationId) filters.correlation_id = searchCorrelationId;
        
        // Date range filter
        if (startDate || endDate) {
            filters.created_at = {};
            if (startDate) filters.created_at.$gte = new Date(startDate);
            if (endDate) filters.created_at.$lte = new Date(endDate);
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const pageLimit = Math.min(parseInt(limit), 100); // Max 100 records per page

        const logs = await emailService.getEmailLogs(filters, offset, pageLimit);
        const totalCount = await emailService.getEmailLogsCount(filters);

        logger.info('Email logs retrieved', {
            correlationId,
            page: parseInt(page),
            limit: pageLimit,
            total: totalCount,
            filters
        });

        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / pageLimit),
                totalRecords: totalCount,
                limit: pageLimit,
                hasNext: (parseInt(page) * pageLimit) < totalCount,
                hasPrev: parseInt(page) > 1
            },
            filters,
            correlationId
        });

    } catch (error) {
        logger.error('Failed to retrieve email logs', {
            correlationId: req.correlationId,
            error: error.message
        });
        next(error);
    }
};

module.exports = {
    sendEmailController,
    retryFailedEmailsController,
    getEmailStatsController,
    getEmailLogsController,
    sendEmailLegacy  // For backward compatibility with Kafka consumer
};
