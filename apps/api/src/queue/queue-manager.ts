/**
 * Queue Manager
 * Central management for all BullMQ queues and workers
 */

import { Queue, Worker } from 'bullmq';
import { QueueName, queueConfig } from './config';
import { processVCIssuance } from './jobs/vc-issuance.processor';
import { processVCVerification } from './jobs/vc-verification.processor';
import { processWebhook } from './jobs/webhook.processor';
import { processEmail } from './jobs/email.processor';
import { processDIDOperation } from './jobs/did-operations.processor';

export class QueueManager {
  private queues: Map<QueueName, Queue> = new Map();
  private workers: Map<QueueName, Worker> = new Map();
  private initialized = false;

  /**
   * Initialize all queues and workers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing BullMQ queues...');

    // Create queues
    this.queues.set(
      QueueName.VC_ISSUANCE,
      new Queue(QueueName.VC_ISSUANCE, {
        connection: queueConfig.redis,
        defaultJobOptions: queueConfig.defaultJobOptions,
      })
    );

    this.queues.set(
      QueueName.VC_VERIFICATION,
      new Queue(QueueName.VC_VERIFICATION, {
        connection: queueConfig.redis,
        defaultJobOptions: queueConfig.defaultJobOptions,
      })
    );

    this.queues.set(
      QueueName.WEBHOOKS,
      new Queue(QueueName.WEBHOOKS, {
        connection: queueConfig.redis,
        defaultJobOptions: queueConfig.defaultJobOptions,
      })
    );

    this.queues.set(
      QueueName.EMAILS,
      new Queue(QueueName.EMAILS, {
        connection: queueConfig.redis,
        defaultJobOptions: queueConfig.defaultJobOptions,
      })
    );

    this.queues.set(
      QueueName.DID_OPERATIONS,
      new Queue(QueueName.DID_OPERATIONS, {
        connection: queueConfig.redis,
        defaultJobOptions: queueConfig.defaultJobOptions,
      })
    );

    // Create workers
    this.workers.set(
      QueueName.VC_ISSUANCE,
      new Worker(QueueName.VC_ISSUANCE, processVCIssuance, {
        connection: queueConfig.redis,
        ...queueConfig.workerOptions,
      })
    );

    this.workers.set(
      QueueName.VC_VERIFICATION,
      new Worker(QueueName.VC_VERIFICATION, processVCVerification, {
        connection: queueConfig.redis,
        ...queueConfig.workerOptions,
      })
    );

    this.workers.set(
      QueueName.WEBHOOKS,
      new Worker(QueueName.WEBHOOKS, processWebhook, {
        connection: queueConfig.redis,
        ...queueConfig.workerOptions,
      })
    );

    this.workers.set(
      QueueName.EMAILS,
      new Worker(QueueName.EMAILS, processEmail, {
        connection: queueConfig.redis,
        ...queueConfig.workerOptions,
      })
    );

    this.workers.set(
      QueueName.DID_OPERATIONS,
      new Worker(QueueName.DID_OPERATIONS, processDIDOperation, {
        connection: queueConfig.redis,
        ...queueConfig.workerOptions,
      })
    );

    // Setup event listeners
    this.setupEventListeners();

    this.initialized = true;
    console.log('✅ BullMQ queues initialized successfully');
    console.log(`   Queues: ${Array.from(this.queues.keys()).join(', ')}`);
  }

  /**
   * Setup event listeners for queues and workers
   */
  private setupEventListeners(): void {
    for (const [name, worker] of this.workers.entries()) {
      worker.on('completed', (job) => {
        console.log(`✅ [${name}] Job ${job.id} completed`);
      });

      worker.on('failed', (job, err) => {
        console.error(`❌ [${name}] Job ${job?.id} failed:`, err.message);
      });

      worker.on('error', (err) => {
        console.error(`🔥 [${name}] Worker error:`, err);
      });
    }
  }

  /**
   * Get a queue by name
   */
  getQueue(name: QueueName): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Get a worker by name
   */
  getWorker(name: QueueName): Worker | undefined {
    return this.workers.get(name);
  }

  /**
   * Get all queues
   */
  getAllQueues(): Map<QueueName, Queue> {
    return this.queues;
  }

  /**
   * Get all workers
   */
  getAllWorkers(): Map<QueueName, Worker> {
    return this.workers;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(name: QueueName): Promise<any> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllStats(): Promise<any[]> {
    const stats = [];
    for (const name of this.queues.keys()) {
      stats.push(await this.getQueueStats(name));
    }
    return stats;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(name: QueueName): Promise<void> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }
    await queue.pause();
    console.log(`⏸️  Queue ${name} paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(name: QueueName): Promise<void> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }
    await queue.resume();
    console.log(`▶️  Queue ${name} resumed`);
  }

  /**
   * Clean completed jobs from a queue
   */
  async cleanQueue(name: QueueName, grace: number = 3600000): Promise<void> {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }
    await queue.clean(grace, 1000, 'completed');
    await queue.clean(grace * 7, 1000, 'failed');
    console.log(`🧹 Queue ${name} cleaned`);
  }

  /**
   * Gracefully shutdown all queues and workers
   */
  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down BullMQ queues...');

    // Close workers first
    for (const [name, worker] of this.workers.entries()) {
      console.log(`   Closing worker: ${name}`);
      await worker.close();
    }

    // Then close queues
    for (const [name, queue] of this.queues.entries()) {
      console.log(`   Closing queue: ${name}`);
      await queue.close();
    }

    this.queues.clear();
    this.workers.clear();
    this.initialized = false;

    console.log('✅ BullMQ shutdown complete');
  }
}

// Singleton instance
export const queueManager = new QueueManager();
