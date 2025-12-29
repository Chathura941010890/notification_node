#!/usr/bin/env node

const NotificationHistory = require('../app/models/notificationHistory.model');
const sequelize = require('../app/db_con');

async function checkNotificationHistory() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
        
        // Check all notifications
        const allNotifications = await NotificationHistory.findAll({
            order: [['id', 'DESC']],
            limit: 10
        });
        
        console.log(`📱 Total notifications found: ${allNotifications.length}`);
        
        if (allNotifications.length > 0) {
            console.log('\n📋 Recent notifications:');
            allNotifications.forEach((notification, index) => {
                console.log(`${index + 1}. ID: ${notification.id}`);
                console.log(`   Email: ${notification.email}`);
                console.log(`   Title: ${notification.title}`);
                console.log(`   Status: ${notification.status}`);
                console.log(`   Read at: ${notification.read_at}`);
                console.log(`   Created: ${notification.created_at}`);
                console.log('');
            });
        }
        
        // Check specific notification ID 17
        const notification17 = await NotificationHistory.findOne({
            where: { id: 17 }
        });
        
        if (notification17) {
            console.log('🎯 Notification ID 17 found:');
            console.log('   Email:', notification17.email);
            console.log('   Title:', notification17.title);
            console.log('   Status:', notification17.status);
            console.log('   Read at:', notification17.read_at);
            console.log('   Created:', notification17.created_at);
        } else {
            console.log('❌ Notification ID 17 not found');
        }
        
        // Check notifications for chathuraj@inqube.com
        const userNotifications = await NotificationHistory.findAll({
            where: { email: 'chathuraj@inqube.com' },
            order: [['id', 'DESC']],
            limit: 5
        });
        
        console.log(`\n👤 Notifications for chathuraj@inqube.com: ${userNotifications.length}`);
        userNotifications.forEach(notification => {
            console.log(`   ID: ${notification.id}, Status: ${notification.status}, Read: ${notification.read_at ? 'Yes' : 'No'}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkNotificationHistory();