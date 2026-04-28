import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        console.log('Redis connection failed too many times. Caching will be disabled.');
        return false; // Stop retrying
      }
      return 5000; // Retry after 5 seconds
    }
  }
});

let isConnected = false;

redisClient.on('error', (err) => {
  if (isConnected) {
    console.log('Redis Client Error', err.message);
  }
});

export const connectRedis = async () => {
  if (isConnected) return;
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
    isConnected = true;
  } catch (err) {
    console.error('Redis not found. Caching will be skipped.');
    isConnected = false;
  }
};

export const getCache = async (key) => {
  if (!isConnected) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis Get Error for key ${key}:`, err);
    return null;
  }
};

export const setCache = async (key, value, duration = 3600) => {
  if (!isConnected) return;
  try {
    await redisClient.setEx(key, duration, JSON.stringify(value));
  } catch (err) {
    console.error(`Redis Set Error for key ${key}:`, err);
  }
};

export const deleteCache = async (key) => {
  if (!isConnected) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`Redis Delete Error for key ${key}:`, err);
  }
};

// Middleware for caching responses
export const cacheMiddleware = (duration = 600) => {
  return async (req, res, next) => {
    if (!isConnected) return next();

    // Use originalUrl as the cache key, but skip for non-GET requests
    if (req.method !== 'GET') return next();

    // Include user ID in cache key for user-specific data
    const userId = req.user?.id || 'public';
    const key = `cache:${userId}:${req.originalUrl}`;

    const cachedData = await getCache(key);
    if (cachedData) {
      return res.status(200).json({
        status: 'success',
        source: 'cache',
        data: cachedData
      });
    }

    // Override res.json to capture the response and save to cache
    const originalJson = res.json;
    res.json = (body) => {
      if (body.status === 'success' && body.data) {
        setCache(key, body.data, duration);
      }
      return originalJson.call(res, body);
    };

    next();
  };
};

export default redisClient;
