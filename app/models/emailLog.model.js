const { DataTypes } = require('sequelize');
const sequelize = require('../db_con/index.js');

const EmailLog = sequelize.define('email_logs', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    correlation_id: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    recipients: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    cc: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    bcc: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    text_content: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    html_content: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('success', 'failure'),
        allowNull: false,
        index: true
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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
    tableName: 'email_logs',
    timestamps: false,
    indexes: [
        {
            fields: ['topic', 'status']
        },
        {
            fields: ['created_at']
        },
        {
            fields: ['correlation_id']
        }
    ]
});

module.exports = EmailLog;
