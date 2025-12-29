const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafkaConfig = {
  clientId: 'inqube-notofication-service',
  brokers: [process.env.KAFKA_BROKERS || '172.33.0.107:9092'],
};

const kafka = new Kafka(kafkaConfig);

module.exports = {
  kafka
}