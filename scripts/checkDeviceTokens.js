#!/usr/bin/env node

const DeviceToken = require('../app/models/deviceToken.model');
const sequelize = require('../app/db_con');

async function checkDeviceTokens() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
        
        const tokens = await DeviceToken.findAll();
        console.log(`📱 Device tokens in database: ${tokens.length}`);
        
        if (tokens.length > 0) {
            console.log('\n📋 Device tokens:');
            tokens.forEach((token, index) => {
                console.log(`${index + 1}. Email: ${token.email}`);
                console.log(`   Token: ${token.device_token.substring(0, 30)}...`);
                console.log(`   Platform: ${token.platform}`);
                console.log(`   Active: ${token.is_active}`);
                console.log(`   Last seen: ${token.last_seen}`);
                console.log('');
            });
        } else {
            console.log('❌ No device tokens found in database');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDeviceTokens();