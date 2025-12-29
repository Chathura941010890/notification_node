#!/usr/bin/env node

const notificationService = require('../app/services/notificationService');

async function testMarkAllAsRead() {
    try {
        console.log('🧪 Testing markAllNotificationsAsRead function...');
        
        // Test 1: Mark specific notifications as read
        console.log('\n📋 Test 1: Mark specific notifications as read');
        const specificIds = [18, 19, 20]; // Example IDs
        const result1 = await notificationService.markAllNotificationsAsRead(
            'chathuraj@inqube.com', 
            specificIds
        );
        console.log('Result for specific IDs:', result1);
        
        // Test 2: Mark all notifications as read (no IDs provided)
        console.log('\n📋 Test 2: Mark all unread notifications as read');
        const result2 = await notificationService.markAllNotificationsAsRead(
            'chathuraj@inqube.com'
        );
        console.log('Result for all notifications:', result2);
        
        // Test 3: Test with empty array
        console.log('\n📋 Test 3: Mark all with empty array');
        const result3 = await notificationService.markAllNotificationsAsRead(
            'chathuraj@inqube.com', 
            []
        );
        console.log('Result with empty array:', result3);
        
        console.log('\n🎉 All tests completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run the test
if (require.main === module) {
    testMarkAllAsRead()
        .then(() => {
            console.log('✅ Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testMarkAllAsRead };