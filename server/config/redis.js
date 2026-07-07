const Redis = require('ioredis');

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: () => null, // Stop reconnecting to prevent terminal spam
};

const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis(6379, '127.0.0.1', redisOptions);

connection.on('connect', () => {
  console.log('Redis connected successfully');
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = connection;
