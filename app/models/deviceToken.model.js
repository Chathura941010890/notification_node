const { DataTypes } = require('sequelize');
const sequelize = require('../db_con');

const DeviceToken = sequelize.define('DeviceToken', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    device_token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
    },
    platform: {
        type: DataTypes.ENUM('ios', 'android', 'web'),
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    last_seen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    app_version: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_device_tokens',
    timestamps: false,
    indexes: [
        { fields: ['email'] },
        { fields: ['is_active'] },
        { fields: ['last_seen'] }
    ]
});

module.exports = DeviceToken;