const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            next(new AppError(message, 429));
        }
    });
};

const emailRateLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    50, // limit each IP to 50 email requests per windowMs
    'Too many email requests from this IP, please try again later'
);

const notificationRateLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    1000, // limit each IP to 100 notification requests per windowMs
    'Too many notification requests from this IP, please try again later'
);

const generalRateLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    1000, // limit each IP to 1000 requests per windowMs
    'Too many requests from this IP, please try again later'
);

module.exports = {
    emailRateLimiter,
    notificationRateLimiter,
    generalRateLimiter
};
