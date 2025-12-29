#!/usr/bin/env node

const admin = require("firebase-admin");
const path = require('path');

async function testNotificationSending() {
    try {
        console.log('🔥 Testing Notification Sending...');
        
        // Initialize Firebase Admin
        const serviceAccountPath = path.join(__dirname, '..', 'app', 'firebase', 'config', 'inqube-notification-service-firebase-adminsdk.json');
        const serviceAccount = require(serviceAccountPath);
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin initialized');
        }
        
        const messaging = admin.messaging();
        
        // Test with a real FCM token from the database
        const testToken = 'ffq3v2iBSW--Qe858lga4p:APA91bHTRYRyhb2mJlnQ3UDMgs7yDhAVo3e7-tOWqe07BKG4bYkMHmXrOPQ6LIttmYZ4wWqI1srug8T0_vsTv8cexoZSqyg8diPux1H2IXineYjfTHkQZWo';
        
        console.log('📱 Testing with token:', testToken.substring(0, 30) + '...');
        
        // Test 1: Simple send
        console.log('\n🧪 Test 1: Simple send method');
        try {
            const messageId = await messaging.send({
                token: testToken,
                notification: {
                    title: 'Test Notification',
                    body: 'This is a test message from the notification service'
                },
                data: {
                    test: 'true',
                    timestamp: Date.now().toString()
                }
            });
            console.log('✅ Simple send successful:', messageId);
        } catch (error) {
            console.log('❌ Simple send failed:', error.code, error.message);
        }
        
        // Test 2: sendEachForMulticast
        console.log('\n🧪 Test 2: sendEachForMulticast method');
        try {
            const response = await messaging.sendEachForMulticast({
                tokens: [testToken],
                notification: {
                    title: 'Test Batch Notification',
                    body: 'This is a test batch message'
                },
                data: {
                    test: 'true',
                    timestamp: Date.now().toString()
                }
            });
            console.log('✅ Batch send successful:', {
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses.map(r => ({
                    success: r.success,
                    messageId: r.messageId,
                    error: r.error ? { code: r.error.code, message: r.error.message } : null
                }))
            });
        } catch (error) {
            console.log('❌ Batch send failed:', error.code, error.message);
        }
        
        // Test 3: Test with invalid token
        console.log('\n🧪 Test 3: Testing with invalid token');
        try {
            const response = await messaging.sendEachForMulticast({
                tokens: ['invalid_token_12345'],
                notification: {
                    title: 'Test with Invalid Token',
                    body: 'This should fail'
                },
                data: {
                    test: 'true'
                }
            });
            console.log('📊 Invalid token test result:', {
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses.map(r => ({
                    success: r.success,
                    error: r.error ? { code: r.error.code, message: r.error.message } : null
                }))
            });
        } catch (error) {
            console.log('❌ Invalid token test failed:', error.code, error.message);
        }
        
        console.log('\n🎉 Notification testing completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run the test
if (require.main === module) {
    testNotificationSending()
        .then(() => {
            console.log('✅ Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testNotificationSending };