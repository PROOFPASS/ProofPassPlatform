/**
 * BullMQ Queue Configuration
 * Redis-based job queue for async operations
 */

import type { ConnectionOptions, QueueOptions, WorkerOptions } from 'bullmq';

export interface QueueConfig {
  redis: ConnectionOptions;
  defaultJobOptions: QueueOptions['defaultJobOptions'];
  workerOptions: Omit<WorkerOptions, 'connection'>;
}

// Redis connection configuration
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
};

// Default job options
export const defaultJobOptions: QueueOptions['defaultJobOptions'] = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 seconds
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000, // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    count: 5000, // Keep last 5000 failed jobs
  },
};

// Worker options
export const workerOptions: Omit<WorkerOptions, 'connection'> = {
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // per second
  },
};

// Queue names
export enum QueueName {
  VC_ISSUANCE = 'vc-issuance',
  VC_VERIFICATION = 'vc-verification',
  WEBHOOKS = 'webhooks',
  EMAILS = 'emails',
  DID_OPERATIONS = 'did-operations',
}

// Job priorities
export enum JobPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1,
  CRITICAL = 0,
}

export const queueConfig: QueueConfig = {
  redis: redisConnection,
  defaultJobOptions,
  workerOptions,
};
