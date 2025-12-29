const axios = require('axios');
const config = require('../app/config');

async function healthCheck() {
    const baseUrl = `http://localhost:${config.port}/notification/api/v1`;
    
    console.log('🔍 Running health check...');
    console.log(`Base URL: ${baseUrl}`);
    
    try {
        // Test health endpoint
        const healthResponse = await axios.get(`${baseUrl}/health`, {
            timeout: 5000
        });
        
        console.log('✅ Health Check Results:');
        console.log('Status:', healthResponse.data.status);
        console.log('Services:', JSON.stringify(healthResponse.data.services, null, 2));
        
        // Test email stats endpoint
        try {
            const statsResponse = await axios.get(`${baseUrl}/email/stats`, {
                timeout: 5000
            });
            console.log('✅ Email Stats:', statsResponse.data.stats);
        } catch (statsError) {
            console.log('⚠️  Email stats endpoint not accessible:', statsError.message);
        }
        
        console.log('🎉 Service is healthy and running!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Health check failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received. Is the service running?');
            console.error('Make sure to start the service first: npm start');
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

if (require.main === module) {
    healthCheck();
}

module.exports = healthCheck;
