const { Kafka } = require('kafkajs');
const config = require('../config');
const logger = require('../utils/logger');

const kafka = new Kafka({
    clientId: 'inqube-notification-service',
    brokers: config.kafka.brokers,
});

class KafkaConsumer {
    constructor(groupId = config.kafka.groupId) {
        this.consumer = kafka.consumer({ groupId });
    }

    async consume(topics, callback) {
        try {
            await this.consumer.connect();
            logger.info('Kafka consumer connected successfully', { 
                brokers: config.kafka.brokers,
                topics 
            });

            // Subscribe to multiple topics
            for (const topic of topics) {
                await this.consumer.subscribe({ topic, fromBeginning: true });
            }

            // Start consuming messages
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    const value = message.value.toString();
                    logger.info('Kafka message received', {
                        topic,
                        partition,
                        offset: message.offset,
                        timestamp: message.timestamp
                    });
                    
                    try {
                        await callback(topic, partition, value);
                    } catch (error) {
                        logger.error('Error processing Kafka message', {
                            topic,
                            partition,
                            offset: message.offset,
                            error: error.message
                        });
                    }
                },
            });
        } catch (error) {
            logger.error('Error in Kafka consumer', { error: error.message });
        }
    }

    async disconnect() {
        try {
            await this.consumer.disconnect();
            logger.info('Kafka consumer disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting Kafka consumer', { error: error.message });
        }
    }
}

module.exports = KafkaConsumer;
