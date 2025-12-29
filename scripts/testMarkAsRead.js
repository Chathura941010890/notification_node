#!/usr/bin/env node

const notificationService = require('../app/services/notificationService');

async function testMarkAsRead() {
    try {
        console.log('🧪 Testing markNotificationAsRead function...');
        
        // Test marking notification 17 as read for chathuraj@inqube.com
        const result = await notificationService.markNotificationAsRead(17, 'chathuraj@inqube.com');
        
        console.log('📥 Mark as read result:', result);
        
        if (result) {
            console.log('✅ Notification marked as read successfully!');
        } else {
            console.log('❌ Failed to mark notification as read');
        }
        
        console.log('🎉 Test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run the test
if (require.main === module) {
    testMarkAsRead()
        .then(() => {
            console.log('✅ Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testMarkAsRead };