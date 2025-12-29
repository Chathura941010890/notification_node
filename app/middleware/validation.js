const AppError = require('../utils/appError');

const validateEmailData = (req, res, next) => {
    const { to, subject, text, html } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0) {
        return next(new AppError('Recipients (to) field is required and must be a non-empty array', 400));
    }

    if (!subject || subject.trim() === '') {
        return next(new AppError('Subject field is required', 400));
    }

    if (!text && !html) {
        return next(new AppError('Either text or html content is required', 400));
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = to.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
        return next(new AppError(`Invalid email addresses: ${invalidEmails.join(', ')}`, 400));
    }

    // Validate CC emails if provided
    if (req.body.cc && Array.isArray(req.body.cc)) {
        const invalidCcEmails = req.body.cc.filter(email => email && !emailRegex.test(email));
        if (invalidCcEmails.length > 0) {
            return next(new AppError(`Invalid CC email addresses: ${invalidCcEmails.join(', ')}`, 400));
        }
    }

    // Validate BCC emails if provided
    if (req.body.bcc && Array.isArray(req.body.bcc)) {
        const invalidBccEmails = req.body.bcc.filter(email => email && !emailRegex.test(email));
        if (invalidBccEmails.length > 0) {
            return next(new AppError(`Invalid BCC email addresses: ${invalidBccEmails.join(', ')}`, 400));
        }
    }

    next();
};

const validateNotificationData = (req, res, next) => {
    const { deviceTokens, title, body } = req.body;

    if (!deviceTokens || !Array.isArray(deviceTokens) || deviceTokens.length === 0) {
        return next(new AppError('Device tokens are required and must be a non-empty array', 400));
    }

    if (!title || title.trim() === '') {
        return next(new AppError('Title is required', 400));
    }

    if (!body || body.trim() === '') {
        return next(new AppError('Body is required', 400));
    }

    // Validate device tokens (basic check for non-empty strings)
    const invalidTokens = deviceTokens.filter(token => !token || typeof token !== 'string' || token.trim() === '');
    if (invalidTokens.length > 0) {
        return next(new AppError('All device tokens must be non-empty strings', 400));
    }

    next();
};

const validateTopicParam = (req, res, next) => {
    const { topic } = req.params;

    if (!topic || topic.trim() === '') {
        return next(new AppError('Topic parameter is required', 400));
    }

    next();
};

const validateDeviceRegistration = (req, res, next) => {
    const { email, deviceToken, platform } = req.body;

    if (!email || email.trim() === '') {
        return next(new AppError('Email is required', 400));
    }

    if (!deviceToken || deviceToken.trim() === '') {
        return next(new AppError('Device token is required', 400));
    }

    if (!platform || platform.trim() === '') {
        return next(new AppError('Platform is required', 400));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return next(new AppError('Invalid email format', 400));
    }

    // Validate platform
    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
        return next(new AppError('Platform must be ios, android, or web', 400));
    }

    // Normalize platform
    req.body.platform = platform.toLowerCase();

    next();
};

const validateDeviceToken = (req, res, next) => {
    const { deviceToken } = req.params;

    if (!deviceToken || deviceToken.trim() === '') {
        return next(new AppError('Device token is required', 400));
    }

    next();
};

module.exports = {
    validateEmailData,
    validateNotificationData,
    validateTopicParam,
    validateDeviceRegistration,
    validateDeviceToken
};
