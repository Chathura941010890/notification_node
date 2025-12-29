const { DataTypes } = require('sequelize');
const sequelize = require('../db_con');

const NotificationHistory = sequelize.define('NotificationHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    device_token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('sent', 'delivered', 'failed', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
        index: true
    },
    delivery_status: {
        type: DataTypes.ENUM('online', 'offline', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown'
    },
    fcm_message_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    delivered_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    priority: {
        type: DataTypes.ENUM('normal', 'high'),
        defaultValue: 'normal'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_notification_history',
    timestamps: false,
    indexes: [
        { fields: ['email', 'status'] },
        { fields: ['created_at'] },
        { fields: ['expires_at'] },
        { fields: ['correlation_id'] }
    ]
});

module.exports = NotificationHistory;