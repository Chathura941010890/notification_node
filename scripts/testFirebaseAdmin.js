#!/usr/bin/env node

/**
 * Firebase Admin SDK Method Test
 * 
 * This script tests the availability of Firebase messaging methods
 * and helps debug the "sendMulticast is not a function" error
 */

const admin = require("firebase-admin");
const path = require('path');

async function testFirebaseAdmin() {
    try {
        console.log('🔥 Firebase Admin SDK Test Starting...');
        
        // Initialize Firebase Admin
        const serviceAccountPath = path.join(__dirname, '..', 'app', 'firebase', 'config', 'inqube-notification-service-firebase-adminsdk.json');
        const serviceAccount = require(serviceAccountPath);
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin initialized');
        }
        
        // Get messaging instance
        const messaging = admin.messaging();
        console.log('✅ Messaging instance created');
        
        // Check available methods
        const prototype = Object.getPrototypeOf(messaging);
        const methods = Object.getOwnPropertyNames(prototype).filter(name => typeof messaging[name] === 'function');
        
        console.log('📋 Available messaging methods:');
        methods.forEach(method => {
            console.log(`   - ${method}`);
        });
        
        // Test specific methods
        const methodsToTest = ['send', 'sendMulticast', 'sendEachForMulticast', 'sendAll'];
        
        console.log('\n🔍 Testing specific methods:');
        methodsToTest.forEach(method => {
            const exists = typeof messaging[method] === 'function';
            console.log(`   ${method}: ${exists ? '✅ Available' : '❌ Not available'}`);
        });
        
        // Test with a dummy token (this will fail but will tell us if the method exists)
        console.log('\n🧪 Testing method calls:');
        
        if (messaging.send) {
            try {
                await messaging.send({
                    token: 'test_token_that_will_fail',
                    notification: { title: 'Test', body: 'Test' }
                });
            } catch (error) {
                console.log(`   send(): ✅ Method exists (error: ${error.code || error.message})`);
            }
        }
        
        if (messaging.sendEachForMulticast) {
            try {
                await messaging.sendEachForMulticast({
                    tokens: ['test_token_that_will_fail'],
                    notification: { title: 'Test', body: 'Test' }
                });
            } catch (error) {
                console.log(`   sendEachForMulticast(): ✅ Method exists (error: ${error.code || error.message})`);
            }
        } else {
            console.log(`   sendEachForMulticast(): ❌ Method not available`);
        }
        
        if (messaging.sendMulticast) {
            try {
                await messaging.sendMulticast({
                    tokens: ['test_token_that_will_fail'],
                    notification: { title: 'Test', body: 'Test' }
                });
            } catch (error) {
                console.log(`   sendMulticast(): ✅ Method exists (error: ${error.code || error.message})`);
            }
        } else {
            console.log(`   sendMulticast(): ❌ Method not available`);
        }
        
        console.log('\n🎉 Firebase method test completed!');
        
    } catch (error) {
        console.error('❌ Firebase test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run the test
if (require.main === module) {
    testFirebaseAdmin()
        .then(() => {
            console.log('✅ Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testFirebaseAdmin };