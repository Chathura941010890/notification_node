const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/appError');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(new AppError('Access token is required', 401));
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
        if (err) {
            return next(new AppError('Invalid or expired token', 403));
        }
        req.user = user;
        next();
    });
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, config.jwt.secret, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
};

module.exports = { 
    authenticateToken,
    optionalAuth
};
