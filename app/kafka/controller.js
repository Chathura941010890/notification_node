const KafkaConsumer = require('./consumer');
const { sendNotification } = require('../firebase/functions/sendNotifications');
const { sendEmailLegacy } = require('../controllers/email.controller');
const { saveDeviceToken } = require('../repositories/deviceToken.repo');
const logger = require('../utils/logger');

const consumeMessageFromKafka = async () => {
    try {
        const kafkaConsumer = new KafkaConsumer('push-notification-group');

        // Define the callback function to process messages
        const messageCallback = async (topic, partition, value) => {
            logger.info('Kafka message processing started', { 
                topic, 
                partition, 
                messageSize: value.length 
            });
        
            // Use a switch statement to handle different topics
            switch (topic) {

                ///////////////// Email Topics //////////////////////////////
        
                case 'pdc_email_notification':
                    logger.info('Processing pdc_email_notification message');
                    await sendEmailLegacy({ ...JSON.parse(value), topic: 'pdc_email_notification' });
                    break;
                
                case 'auth_email_notification':
                    logger.info('Processing auth_email_notification message');
                    await sendEmailLegacy({ ...JSON.parse(value), topic: 'auth_email_notification' });
                    break;

                case 'cargo_email_notification':
                    logger.info('Processing cargo_email_notification message');
                    await sendEmailLegacy({ ...JSON.parse(value), topic: 'cargo_email_notification' });
                    break;
                
                case 'hod_email_notification':
                    logger.info('Processing hod_email_notification message');
                    await sendEmailLegacy({ ...JSON.parse(value), topic: 'hod_email_notification' });
                    break;

                case 'gatepass_email_notification':
                    logger.info('Processing gatepass_email_notification message');
                    await sendEmailLegacy({ ...JSON.parse(value), topic: 'gatepass_email_notification' });
                    break;

                /////////////////////// Notification Topics ///////////////////////////

                case 'pdc_notification':
                    logger.info('Processing pdc_notification message');
                    logger.debug('Raw Kafka message for pdc_notification:', { 
                        partition, 
                        messageContent: value,
                        messageLength: value.length 
                    });
                    await sendNotification(value);
                    break;

                case 'gatepass_fcm_notification':
                    logger.info('Processing gatepass_fcm_notification message');
                    await sendNotification(value);
                    break;

                case 'auth_notification':
                    logger.info('Processing auth_notification message');
                    await sendNotification(value);
                    break;
                
                case 'test_notification':                    
                    logger.info('Processing test_notification message');
                    await sendNotification(value);
                    break;
                
                //////////////////////// Other Topics ////////////////////////////
                
                case 'register_device_tokens':
                    logger.info('Processing register_device_tokens message');

                    const JsonValue = JSON.parse(value);

                    if(!JsonValue.deviceToken || !JsonValue.email){
                        throw new Error("Empty fields: deviceToken and email are required");
                    }

                    const platform = JsonValue.platform || 'android'; // Default to android if not specified
                    await saveDeviceToken(JsonValue.deviceToken, JsonValue.email, platform);
                    break;
            
                default:
                    logger.warn('Unhandled Kafka topic', { topic });
                    // Optional: Add fallback logic for unknown topics
            }
        };        

        // Topics to subscribe to
        const topics = [ 
            'pdc_email_notification', 
            'auth_email_notification', 
            'cargo_email_notification',
            'hod_email_notification',
            'gatepass_email_notification', 
            'pdc_notification', 
            'gatepass_fcm_notification',
            'auth_notification',
            'test_notification',
            'register_device_tokens'
        ];

        // Consume messages from the specified topics
        await kafkaConsumer.consume(topics, messageCallback);

    } catch (error) {
        console.error('Error consuming messages:', error);
    }
};

module.exports = {
    consumeMessageFromKafka,
};
