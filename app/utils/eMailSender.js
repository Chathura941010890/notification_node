const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

// Create the transporter ONCE, outside the function using configuration
const transporter = nodemailer.createTransport(config.email.smtp);

const sendEmail = async (options) => {
    if (options.to && options.subject && (options.text || options.html) && options.to.length > 0) {
        const mailOptions = {
            from: options.from || config.email.smtp.auth.user,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc || '',
            bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc || '',
            subject: options.subject,
            text: options.text || '',
            html: options.html || ''
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            logger.info('Email sent successfully (legacy utility)', {
                messageId: info.messageId,
                recipients: options.to
            });
            return {
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            logger.error('Email send failed (legacy utility)', {
                error: error.message,
                recipients: options.to
            });
            throw error;
        }
    } else {
        const errorMsg = "Required fields (to, subject, and either text or html) are missing or empty.";
        logger.warn('Email validation failed', { 
            error: errorMsg,
            providedFields: Object.keys(options)
        });
        throw new Error(errorMsg);
    }
};

const emailOptions = {
    from: 'noreply@inqube.com',
    to: [], // Array of recipients
    cc: [],     // Array of CC recipients
    bcc: [],  // Array of BCC recipients
    subject: 'Email From Inqube Notifications',
    text: 'This is a test email from Inqube Notifications.'
};

module.exports = {
    sendEmail,
    emailOptions
};