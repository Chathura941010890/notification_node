#!/usr/bin/env node

const notificationService = require('../app/services/notificationService');

async function testNotificationService() {
    try {
        console.log('🧪 Testing Notification Service...');
        
        // Test with a proper notification message
        const testMessage = JSON.stringify({
            emails: ['chathuraj@inqube.com'],
            title: 'Test Notification',
            body: 'This is a test notification from the service',
            data: {
                type: 'test',
                priority: 'normal'
            },
            priority: 'normal',
            ttl: 86400
        });
        
        console.log('📤 Sending test notification with message:', testMessage);
        
        const result = await notificationService.sendNotification(testMessage, 'test-correlation-id');
        
        console.log('📥 Notification result:', result);
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run the test
if (require.main === module) {
    testNotificationService()
        .then(() => {
            console.log('🎉 Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testNotificationService };