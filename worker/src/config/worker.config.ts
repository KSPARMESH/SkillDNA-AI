import dotenv from 'dotenv';
dotenv.config();

export const workerConfig = {
  env: process.env.NODE_ENV || 'development',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || '',
  concurrency: 5,
  queues: {
    githubSync: 'github-sync-queue',
    analytics: 'analytics-queue',
    notifications: 'notifications-queue',
    reports: 'reports-queue',
    wrapped: 'wrapped-queue',
    roadmap: 'roadmap-queue',
  },
};
