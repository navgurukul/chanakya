const redis = require("redis");
require("dotenv").config();

// redisClient.js
const Redis = require('ioredis');
const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

module.exports = redisClient;