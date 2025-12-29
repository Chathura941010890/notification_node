// const redis = require('redis');

// const redisClient = redis.createClient({
//   host: '127.0.0.1',
//   port: 6379,
// });

// redisClient.on('error', (err) => {
//   console.error('Redis error:', err);
// });

// redisClient.on('connect', () => {
//   console.log('Connected to Redis');
// });

// redisClient.on('end', async () => {
//   console.log('Redis connection closed, attempting to reconnect...');
//   await redisClient.connect();
// });

// redisClient.connect().catch(err => console.error('Failed to connect to Redis:', err));

// module.exports = redisClient;
